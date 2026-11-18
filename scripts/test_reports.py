"""Exercise report persistence, retries, origin checks and corrupt-file recovery."""
import concurrent.futures
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

import local_server


class ReportsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        local_server.REPORTS_PATH = Path(cls.temp.name) / "reports.json"
        cls.server = local_server.LocalServer(("127.0.0.1", 0), local_server.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}/api/audio-reports"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.temp.cleanup()

    def setUp(self):
        local_server.REPORTS_PATH.write_text("[]", encoding="utf-8")

    def request(self, reports=None, origin=None):
        data = None if reports is None else json.dumps(reports).encode()
        headers = {"Content-Type": "application/json"}
        if origin:
            headers["Origin"] = origin
        request = urllib.request.Request(self.url, data=data, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            with error:
                return error.code, json.load(error)

    def record(self, identity):
        return dict(id=identity, createdAt="2026-11-17T12:00:00Z",
                    kind="word", word="ship", audio="audio/en/ship.ogg", comment="Too fast")

    def test_concurrent_retries(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as workers:
            statuses = list(workers.map(lambda _: self.request([self.record("one")])[0], range(8)))
        self.assertEqual(statuses, [200] * 8)
        self.assertEqual(self.request()[1], [self.record("one")])
        self.assertEqual(json.loads(local_server.REPORTS_PATH.read_text()), [self.record("one")])

    def test_foreign_origin(self):
        self.assertEqual(self.request([self.record("one")], "https://example.org")[0], 403)
        self.assertEqual(self.request()[1], [])

    def test_invalid_batch_is_atomic(self):
        self.assertEqual(self.request([self.record("one"), {"id": "bad"}])[0], 400)
        self.assertEqual(self.request()[1], [])

    def test_corrupt_file_preserved(self):
        local_server.REPORTS_PATH.write_text("broken", encoding="utf-8")
        self.assertEqual(self.request([self.record("one")])[0], 500)
        self.assertEqual(local_server.REPORTS_PATH.read_text(), "broken")


if __name__ == "__main__":
    unittest.main()
