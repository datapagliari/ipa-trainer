"""Serve IPA Trainer locally and open it in the default Windows browser."""
import os
import sys
import json
from local_server import Handler, LocalServer, REPORTS_PATH
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
URL = "http://localhost:8765/"


def main():
    open_browser = "--no-browser" not in sys.argv
    try:
        server = LocalServer(("127.0.0.1", 8765), Handler)
    except OSError as error:
        try:
            with urlopen(URL + "api/health", timeout=2) as response:
                health = json.load(response)
                running = health.get("app") == "IPA Lab" and health.get("audio_reports") is True
        except (OSError, ValueError):
            running = False
        if not running:
            print(f"Could not start IPA Trainer: {error}. Close any older server on port 8765 and retry.")
            return 1
        if open_browser:
            os.startfile(URL)
        return 0

    with server:
        REPORTS_PATH.parent.mkdir(parents=True, exist_ok=True)
        if not REPORTS_PATH.exists():
            REPORTS_PATH.write_text("[]\n", encoding="utf-8")
        if open_browser:
            os.startfile(URL)
        print(f"IPA Trainer is running at {URL} Press Ctrl+C to stop.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
