"""Serve IPA Trainer locally and open it in the default Windows browser."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
URL = "http://localhost:8765/"


class LocalServer(ThreadingHTTPServer):
    allow_reuse_address = False
    allow_reuse_port = False


def main():
    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    try:
        server = LocalServer(("127.0.0.1", 8765), handler)
    except OSError as error:
        # Also recognize instances started through the original start.cmd.
        try:
            with urlopen(URL, timeout=2) as response:
                running = b"<title>IPA Lab" in response.read(4096)
        except OSError:
            running = False
        if not running:
            print(f"Could not start IPA Trainer: {error}")
            return 1
        os.startfile(URL)
        return 0

    with server:
        os.startfile(URL)
        print(f"IPA Trainer is running at {URL} Press Ctrl+C to stop.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
