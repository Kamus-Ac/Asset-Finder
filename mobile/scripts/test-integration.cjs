const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
process.env.EXPO_PUBLIC_GATEWAY_URL = '';
process.env.ASSET_FINDER_API_TARGET = 'http://127.0.0.1:8000';
process.env.ASSET_FINDER_AI_TARGET = 'http://127.0.0.1:8765';
// Run the actual pure TypeScript services/API adapters without bundling React Native.
const resolve = Module._resolveFilename;
Module._resolveFilename = function(specifier, ...args) { return resolve.call(this, specifier.startsWith('@/') ? path.join(root, 'src', specifier.slice(2)) : specifier, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const catalog = require('../src/services/catalog.ts');
const http = require('../src/services/http.ts');
const media = require('../src/services/media.ts');
const geometry = require('../src/media/geometry.ts');
const backend = require('../src/app/api/backend/[...path]+api.ts');
const visual = require('../src/app/api/visual+api.ts');
const originalFetch = global.fetch;
const uuid = 'dc278d47-4f07-4466-b9d1-22f9d79ec897';
const model = { asset_id: 'sketchfab_real', name: 'Chair', source: 'sketchfab', thumbnail_url: 'https://example.org/chair.png', source_url: 'https://sketchfab.com/3d-models/chair', model_available: false, model_url: null, similarity_score: null };
async function withFetch(fn, body) { global.fetch = fn; try { await body(); } finally { global.fetch = originalFetch; } }
const json = (data, status = 200) => Response.json(data, { status });

test('External catalog: preserve null score, verified availability, nullable metadata and unique IDs', () => {
 const [asset] = catalog.parseAssets([model, model]);
 assert.equal(asset.score, null); assert.equal(asset.available, false); assert.equal(asset.sourceUrl, model.source_url); assert.equal(asset.thumbnailUrl, model.thumbnail_url);
 assert.equal(catalog.parseAssets([{...model, model_available:true, model_url:null}])[0].available,false);
 assert.equal(catalog.parseAssets([{...model, model_available:true, model_url:'javascript:alert(1)', source_url:'file:///private', name:null}])[0].sourceUrl,undefined);
 assert.equal(catalog.parseAssets([{...model, similarity_score:NaN}])[0].score,null);
 assert.throws(()=>catalog.parseAssets([{}]),/identificador/);
});
test('Client uses escaped query and never substitutes demo results for an API failure', async () => {
 await withFetch(async url => { assert.equal(url,'/api/backend/catalog/search?q=silla%20%26%20mesa'); return json({results:[model]}); }, async()=>assert.equal((await catalog.searchCatalog(' silla & mesa '))[0].id,model.asset_id));
 await withFetch(async()=>json({detail:'Sketchfab rechazó la consulta.'},502),async()=>assert.rejects(catalog.searchCatalog('chair'),/Sketchfab rechazó/));
 await assert.rejects(catalog.searchCatalog(''),/1 y 100/);
});
test('Health validates JSON; HTTP errors, invalid JSON, cancellation and timeout stay errors', async () => {
 await withFetch(async()=>json({status:'wrong'}),async()=>assert.rejects(catalog.checkHealth(),/no está listo/));
 await withFetch(async()=>new Response('<html>error</html>',{status:503}),async()=>assert.rejects(http.request('/api/backend/health'),/no válida/));
 for(const status of [413,415,422,503]) await withFetch(async()=>json({detail:'Mensaje de servidor'},status),async()=>assert.rejects(http.request('/x'),error=>error.status===status && error.message==='Mensaje de servidor'));
 const stalled=(_url,{signal})=>new Promise((resolve,reject)=>{if(signal.aborted)reject(new DOMException('Aborted','AbortError'));else signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
 await withFetch(stalled,async()=>{
  await assert.rejects(http.request('/x',{},20),error=>error.status===504);
  const controller=new AbortController();const pending=http.request('/x',{signal:controller.signal});controller.abort();await assert.rejects(pending,error=>error.name==='AbortError');
 });
});
test('Multipart upload preserves boundary handling and resolves normalized file URL through the gateway', async()=>{
 const form=new FormData();form.append('file',new Blob(['png'],{type:'image/png'}),'reference.png');
 await withFetch(async(url,options)=>{
  assert.equal(url,'/api/backend/media');assert.equal(options.body,form);assert.equal(options.headers,undefined);
  const response=json({media_id:uuid,type:'image',width:1024,height:512,file_url:`/media/${uuid}/file`},201);
  Object.defineProperty(response,'url',{value:'http://mobile.test/api/backend/media'});return response;
 },async()=>assert.deepEqual(await media.uploadMedia(form),{id:uuid,width:1024,height:512,fileUrl:`http://mobile.test/api/backend/media/${uuid}/file`}));
});
test('Contained-image coordinates ignore letterboxing and map to normalized server pixels',()=>{
 const landscape=geometry.containedImage(300,320,1200,600);assert.deepEqual(landscape,{x:0,y:85,width:300,height:150});
 assert.equal(geometry.pointInImage(150,40,landscape),null);assert.equal(geometry.pointInImage(undefined,NaN,landscape),null);assert.deepEqual(geometry.pointInImage(150,160,landscape),{x:.5,y:.5});
 const portrait=geometry.containedImage(300,320,200,400);assert.deepEqual(portrait,{x:70,y:0,width:160,height:320});assert.equal(geometry.pointInImage(30,100,portrait),null);
 assert.deepEqual(geometry.selectionBox({x:.5,y:.5},1024,512),[256,102,768,410]);
 const edge=geometry.selectionBox({x:0,y:1},1024,512);assert.equal(edge[0],0);assert.equal(edge[3],512);
});
test('Backend gateway: only permitted paths, same-origin writes, upstream errors and binary streaming',async()=>{
 let calls=0;
 await withFetch(async(url)=>{calls++;assert.equal(url,'http://127.0.0.1:8000/catalog/search?q=chair');return json({results:[model]});},async()=>assert.equal((await backend.GET(new Request('http://mobile.test/api/backend/catalog/search?q=chair'))).status,200));
 await withFetch(async()=>{throw new Error('Must not call upstream');},async()=>{
  assert.equal((await backend.GET(new Request('http://mobile.test/api/backend/catalog/search?q='))).status,422);
  assert.equal((await backend.GET(new Request('http://mobile.test/api/backend/https://example.org'))).status,404);
  assert.equal((await backend.POST(new Request('http://mobile.test/api/backend/media',{method:'POST',headers:{Origin:'https://other.test'},body:'x'}))).status,403);
  assert.equal((await backend.POST(new Request('http://mobile.test/api/backend/media',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}))).status,415);
 });
 assert.equal(calls,1);
 await withFetch(async()=>new Response(new Uint8Array([137,80,78,71]),{headers:{'Content-Type':'image/png'}}),async()=>{
  const result=await backend.GET(new Request(`http://mobile.test/api/backend/media/${uuid}/file`));assert.equal(result.headers.get('content-type'),'image/png');assert.deepEqual([...new Uint8Array(await result.arrayBuffer())],[137,80,78,71]);
 });
 await withFetch(async()=>{throw new Error('Connection refused');},async()=>assert.equal((await backend.GET(new Request('http://mobile.test/api/backend/health'))).status,503));
});
test('Backend gateway rejects an oversized multipart request without forwarding it',async()=>{
 await withFetch(async()=>{throw new Error('Must not forward');},async()=>{
  const result=await backend.POST(new Request('http://mobile.test/api/backend/media',{method:'POST',headers:{'Content-Type':'multipart/form-data; boundary=x'},body:new Uint8Array(11*1024*1024+1)}));assert.equal(result.status,413);
 });
});
test('Visual adapter passes server-normalized image, box, points and counts to the existing IA service',async()=>{
 let runBody;const responseBody={results:[{...model,similarity_score:.83}],mask:'data:image/png;base64,bWFzaw==',crop:'data:image/png;base64,Y3JvcA==',previews:{},comparison:{compared:10,available:24},timings:{total_seconds:2.5},warnings:[]};
 await withFetch(async(url,options)=>{
  if(url.endsWith(`/media/${uuid}`))return json({width:1024,height:512});
  if(url.endsWith(`/media/${uuid}/file`))return new Response(new Uint8Array([137,80,78,71]));
  assert.equal(url,'http://127.0.0.1:8765/run');assert.equal(options.headers.Origin,undefined);runBody=JSON.parse(options.body);return json(responseBody);
 },async()=>{
  const result=await visual.POST(new Request('http://mobile.test/api/visual',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({media_id:uuid,box:[1,2,300,400],points:[{x:10,y:20,label:1}],candidate_limit:10,k:5})}));
  assert.equal(result.status,200);assert.equal(runBody.image,'data:image/png;base64,iVBORw==');assert.deepEqual(runBody.box,[1,2,300,400]);assert.equal(runBody.candidate_limit,10);assert.equal(runBody.k,5);
 });
 await withFetch(async()=>json(responseBody),async()=>{const result=await catalog.compareVisual({media_id:uuid,box:[1,2,300,400],candidate_limit:10,k:5});assert.equal(result.assets[0].score,.83);assert.equal(result.compared,10);});
});
test('Visual validation and unavailable service never produce successful mock comparisons',async()=>{
 await withFetch(async()=>json({width:1024,height:512}),async()=>{
  for(const body of [{media_id:'bad',k:1,candidate_limit:1},{media_id:uuid,k:11,candidate_limit:10},{media_id:uuid,k:1,candidate_limit:1,box:[0,0,5000,1]},{media_id:uuid,k:1,candidate_limit:1,points:[{x:1024,y:0,label:1}]}])assert.equal((await visual.POST(new Request('http://mobile.test/api/visual',{method:'POST',body:JSON.stringify(body)}))).status,422);
 });
 await withFetch(async()=>{throw new Error('Offline');},async()=>assert.equal((await visual.GET()).status,503));
 await withFetch(async()=>json({candidate_count:24,image:'private sample'}),async()=>{const result=await visual.GET();assert.deepEqual(await result.json(),{available:24,mode:'sample'});});
});
