import unittest

from ai.candidates import validate_candidates


def fixture(**updates):
    """Metadatos sintéticos para validación, sin resultados de modelos."""
    return {"asset_id": "test_asset", "name": "Objeto de prueba",
            "source_url": "https://example.invalid/model", **updates}


class CandidateTests(unittest.TestCase):
    def test_unknown_fields_and_unavailable_file(self):
        result = validate_candidates([fixture()])[0]
        self.assertIsNone(result.metadata['license'])
        self.assertIsNone(result.metadata['source'])
        self.assertFalse(result.metadata['model_available'])
        self.assertIsNone(result.metadata['model_url'])
        self.assertEqual(result.views, ())
        self.assertEqual(validate_candidates([]), [])

    def test_bad_identifiers_duplicates_and_urls(self):
        cases = [None, [None], [fixture(asset_id='')], [fixture(),fixture()],
                 [fixture(source_url=None)], [fixture(source_url='file:///etc/passwd')],
                 [fixture(source_url='https://user:pass@example.invalid')],
                 [fixture(views=[{'view_id':'a'},{'view_id':'a'}])],
                 [fixture(model_available=1)]]
        for value in cases:
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_candidates(value)

    def test_verified_file_is_distinct_from_thumbnail(self):
        with self.assertRaises(ValueError):
            validate_candidates([fixture(model_available=True, model_url='/files/model.glb')])
        result=validate_candidates([fixture(model_available=True, model_verified=True,
                                             model_url='/files/model.glb')])[0]
        self.assertTrue(result.metadata['model_available'])
        self.assertEqual(result.metadata['model_url'],'/files/model.glb')
