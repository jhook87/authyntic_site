#!/usr/bin/env python3

import http.server
import socketserver
import os

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()
        
    def guess_type(self, path):
        # Make sure manifest.json is served with correct MIME type
        if path.endswith('.json'):
            return 'application/json'
        return super().guess_type(path)

if __name__ == '__main__':
    PORT = 8000
    Handler = CORSHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving with CORS enabled at http://localhost:{PORT}")
        httpd.serve_forever()