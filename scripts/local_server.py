"""Loopback static server with an atomic, idempotent audio-report store."""
import json
import re
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
REPORTS_PATH = ROOT / "data/audio_reports.json"
REPORT_LOCK = threading.Lock()
FIELDS = {"id", "createdAt", "comment", "kind", "recordingId", "audio", "sourceUrl",
          "word", "language", "ipa", "symbol", "targetId", "exampleId", "mode", "repeatPreview"}


def read_reports():
    if not REPORTS_PATH.exists():
        return []
    reports = json.loads(REPORTS_PATH.read_text(encoding="utf-8"))
    if not isinstance(reports, list):
        raise ValueError("Invalid report file")
    return reports


def validate_report(report):
    if not isinstance(report, dict) or set(report) - FIELDS:
        raise ValueError("Invalid report fields")
    if not re.fullmatch(r"[a-zA-Z0-9-]{1,100}", str(report.get("id", ""))):
        raise ValueError("Invalid report ID")
    if not isinstance(report.get("comment"), str) or not 1 <= len(report["comment"].strip()) <= 2000:
        raise ValueError("A comment is required")
    if report.get("kind") not in ("word", "symbol"):
        raise ValueError("Invalid recording kind")
    if not isinstance(report.get("createdAt"), str) or not report["createdAt"]:
        raise ValueError("A report timestamp is required")
    for key, value in report.items():
        if key == "repeatPreview":
            if not isinstance(value, bool):
                raise ValueError("Invalid repeat flag")
        elif value is not None and (not isinstance(value, str) or len(value) > 4096):
            raise ValueError("Invalid report value")
    return report


class LocalServer(ThreadingHTTPServer):
    allow_reuse_address = False
    allow_reuse_port = False


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def local_request(self):
        host = self.headers.get("Host", "")
        expected_port = self.server.server_port
        allowed = {f"localhost:{expected_port}", f"127.0.0.1:{expected_port}"}
        origin = self.headers.get("Origin")
        return host in allowed and (origin is None or origin == "http://" + host)

    def reply_json(self, status, value):
        payload = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if not self.local_request():
            return self.reply_json(403, {"error": "Local origin required"})
        route = urlsplit(self.path).path
        if route not in ("/api/audio-reports", "/api/health"):
            return super().do_GET()
        try:
            if route == "/api/health":
                return self.reply_json(200, {"app": "IPA Lab", "audio_reports": True})
            with REPORT_LOCK:
                reports = read_reports()
            self.reply_json(200, reports)
        except (OSError, ValueError):
            self.reply_json(500, {"error": "Unable to read reports; existing file preserved"})

    def do_POST(self):
        if self.path != "/api/audio-reports":
            return self.reply_json(404, {"error": "Unknown endpoint"})
        if not self.local_request():
            return self.reply_json(403, {"error": "Local origin required"})
        if self.headers.get_content_type() != "application/json":
            return self.reply_json(415, {"error": "JSON required"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 512000:
                return self.reply_json(413, {"error": "Invalid request size"})
            records = json.loads(self.rfile.read(length))
            if not isinstance(records, list) or len(records) > 100:
                raise ValueError("Expected up to 100 reports")
            records = [validate_report(record) for record in records]
        except (ValueError, TypeError):
            return self.reply_json(400, {"error": "Invalid report data"})
        try:
            with REPORT_LOCK:
                reports = read_reports()
                ids = {record["id"] for record in reports}
                added = [record for record in records if record["id"] not in ids]
                # Repeated entries in the same request receive the same treatment as retries.
                for record in added:
                    if record["id"] not in ids:
                        reports.append(record)
                        ids.add(record["id"])
                if added:
                    REPORTS_PATH.parent.mkdir(parents=True, exist_ok=True)
                    temp = REPORTS_PATH.with_suffix(".tmp")
                    temp.write_text(json.dumps(reports, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                    temp.replace(REPORTS_PATH)
            self.reply_json(200, {"saved": True})
        except (OSError, ValueError, KeyError):
            self.reply_json(500, {"error": "Unable to save reports; existing file preserved"})
