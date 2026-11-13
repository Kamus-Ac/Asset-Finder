from ai.tests.cpu_case import CpuCase


class SearchTests(CpuCase):
    def test_ranking_best_view_ties_empty_and_bad_inputs(self):
        self.run_cpu('''
import numpy as np
from ai.index import CandidateIndex
from ai.embedding import model_identity
from ai.search import search
vectors=np.zeros((3,384),np.float32); vectors[0,0]=1; vectors[1,1]=1; vectors[2,0]=1
rows=[{'asset_id':a,'view_id':v,'image_sha256':'a'*64} for a,v in [('b','first'),('b','second'),('a','first')]]
meta={a:{'asset_id':a,'source_url':'https://example.invalid/'+a} for a in ('a','b')}
index=CandidateIndex(vectors,rows,meta,model_identity(),[])
query=vectors[0]
result=search(query,99,index=index)
assert [r['asset_id'] for r in result]==['a','b'] and result[1]['view_id']=='first'
assert all(r['similarity_score']==1.0 for r in result)
assert len(search(query,1,index=index))==1
empty=CandidateIndex(np.empty((0,384),np.float32),[],{},model_identity(),[])
assert search(query,index=empty)==[]
for k in (0,-1,True,2.5,'3'):
 try: search(query,k,index=index)
 except ValueError: pass
 else: raise AssertionError('k inválido aceptado')
for q in ([1,2], np.zeros(384), np.full(384,np.nan), np.ones(384,bool)):
 try: search(q,index=index)
 except ValueError: pass
 else: raise AssertionError('Vector inválido aceptado')
''')
