from ai.tests.cpu_case import CpuCase


class ResultTests(CpuCase):
    def test_contract_fields_and_real_availability(self):
        self.run_cpu('''
import json
import numpy as np
from ai.index import CandidateIndex
from ai.embedding import model_identity
from ai.results import format_results,RESULT_FIELDS
v=np.zeros((1,384),np.float32);v[0,0]=1
meta={'a':{'asset_id':'a','source_url':'https://example.invalid/a','model_available':False}}
index=CandidateIndex(v,[{'asset_id':'a','view_id':'main','image_sha256':'a'*64}],meta,model_identity(),[])
rank=[{'asset_id':'a','view_id':'main','similarity_score':0.8}]
row=format_results(rank,index=index)[0]
assert set(row)==set(RESULT_FIELDS)|{'similarity_score'}
assert row['license'] is None and row['model_url'] is None and row['model_available'] is False
assert 'view_id' not in row and 'model_verified' not in row
json.dumps(row,allow_nan=False)
for bad in ([{**rank[0],'similarity_score':float('nan')}], [rank[0],rank[0]], [{**rank[0],'asset_id':'missing'}]):
 try:format_results(bad,index=index)
 except ValueError:pass
 else:raise AssertionError('Aceptó salida inválida')
''')
