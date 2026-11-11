from types import SimpleNamespace
import unittest
from unittest.mock import patch

from ai.evaluate import evaluate_queries


class EvaluationTests(unittest.TestCase):
    def test_counts_do_not_turn_unknowns_or_failures_into_hits(self):
        """Fixtures sintéticos solo para comprobar conteos, no precisión de modelos."""
        def query(id,relevant):
            return {'query_id':id,'image':object(),'relevant_asset_ids':relevant}
        outcome=SimpleNamespace(results=[{'asset_id':'known'}],timings={},warnings=[])
        with patch('ai.evaluate.run_search',side_effect=[outcome,RuntimeError('fixture'),outcome,outcome]):
            report=evaluate_queries([query('positive',['known']),query('failed',['known']),
                                     query('unknown',None),query('no-match',[])],[])
        counts=report['counts']
        self.assertEqual(counts,{'positive_queries':2,'without_known_match':1,
                                'unlabelled_queries':1,'top1_hits':1,'top5_hits':1,'failed_queries':1})
        self.assertNotIn('top1_hit',report['queries'][2])
        self.assertIn('error',report['queries'][1])
