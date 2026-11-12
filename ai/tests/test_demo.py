from ai.tests.cpu_case import CpuCase


class DemoTests(CpuCase):
    def test_local_http_errors_and_response_transport(self):
        self.run_cpu('''
import json,threading
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from http.server import ThreadingHTTPServer
from unittest.mock import patch
import numpy as np
from PIL import Image
from ai.demo import handler_for,png_data
from ai.pipeline import Outcome
from ai.segmentation import ServiceUnavailableError
image=Image.new('RGB',(8,8),'red')
items=[{'asset_id':'test','source_url':'https://example.invalid/test',
 'views':[{'view_id':'main','image':image}]}]
server=ThreadingHTTPServer(('127.0.0.1',0),handler_for(items))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
base='http://127.0.0.1:'+str(server.server_port)
def request(payload,origin=None):
 headers={'Content-Type':'application/json'}
 if origin:headers['Origin']=origin
 try:
  with urlopen(Request(base+'/run',data=json.dumps(payload).encode(),headers=headers),timeout=20) as r:return r.status,json.load(r)
 except HTTPError as e:return e.code,json.load(e)
try:
 with urlopen(base+'/') as r:
  page=r.read();assert b'<canvas' in page and b'blender-connect' in page
 with urlopen(base+'/blender-demo.js') as r:
  assert r.headers.get_content_type()=='text/javascript' and b'/imports' in r.read()
 with urlopen(base+'/sample') as r:assert json.load(r)['candidate_count']==1
 assert request({'image':'malformed'})[0]==422
 assert request({'image':png_data(image)},'https://example.invalid')[0]==403
 payload={'image':png_data(image),'box':[0,0,8,8]}
 fake=Outcome(np.ones((8,8),bool),image,[],{'total_seconds':0.1},[],0.9,{'query_hit':False})
 with patch('ai.demo.run_search',return_value=fake):
  status,result=request(payload)
 assert status==200 and result['mask'].startswith('data:image/png;base64,') and result['crop'].startswith('data:image/png;base64,')
 with patch('ai.demo.run_search',side_effect=ServiceUnavailableError('servicio no disponible: fixture')):
  assert request(payload)[0]==503
finally:
 server.shutdown();server.server_close();thread.join(timeout=3)
''')
