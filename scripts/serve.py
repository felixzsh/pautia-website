"""Serve public/ the way Cloudflare serves it.

A request with no extension is the .html file beside it, so /pricing is
pricing.html, exactly as the edge resolves it. Localhost should look like the
site without needing the Worker.

    make serve      # http://127.0.0.1:8080
"""

import http.server
import socketserver
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "public"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        local = super().translate_path(path)
        if not Path(local).exists() and not local.endswith("/"):
            if Path(local + ".html").exists():
                return local + ".html"
        return local


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", port), Handler) as server:
        print(f"http://127.0.0.1:{port}", flush=True)
        server.serve_forever()
