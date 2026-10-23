"""Run with PYTHONPATH pointing to a reviewed checker copy; no live credentials/network."""
import tempfile
import os
import time
import unittest
from adapters import granderson_destinations_inapp as adapter

class AdapterTests(unittest.TestCase):
    def setUp(self):
        adapter.reset_cache()
        self.tmp=tempfile.TemporaryDirectory()
        self.token=os.path.join(self.tmp.name,'read_token')
        with open(self.token,'w') as out: out.write('fixture_only_not_a_real_token_12345')
        os.chmod(self.token,0o600)
        self.calls=0
    def tearDown(self): self.tmp.cleanup()
    def payload(self,outcome='pass',detail='accepted',age=0):
        return {'app':'granderson_destinations','schema':1,'run':{'started_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(time.time()-age)),'deployment_id':'dpl_fixture','results':[{'id':'anthropic_key','outcome':outcome,'detail':detail,'http_status':200,'version_tag':'abcd1234'}]}}
    def check(self,body):
        def fetch(*args): self.calls+=1; return 200,body
        return adapter.check({'check_id':'anthropic_key'},token_path=self.token,fetch=fetch)
    def test_mapping_and_shared_fetch(self):
        result=self.check(self.payload()); self.check(self.payload())
        self.assertEqual(result['code'],'ok');self.assertEqual(result['extra']['version_tag'],'abcd1234');self.assertEqual(self.calls,1)
    def test_stale_success(self): self.assertEqual(self.check(self.payload(age=37*3600))['code'],'no_recent_run')
    def test_stale_exposure_retained(self): self.assertEqual(self.check(self.payload('invalid_auth','secret_in_public_var',37*3600))['code'],'invalid_credential')
    def test_wrong_app_rejected(self):
        body=self.payload();body['app']='another_app';self.assertEqual(self.check(body)['detail'],'bad_payload')
    def test_insecure_file_rejected(self):
        os.chmod(self.token,0o644);self.assertEqual(self.check(self.payload())['detail'],'token_file_perms');self.assertEqual(self.calls,0)

if __name__=='__main__': unittest.main()
