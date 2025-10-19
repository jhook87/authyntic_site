#!/usr/bin/env python3

import hashlib
import hmac
import http.server
import json
import os
import secrets
import socketserver
import time


SESSION_DURATION_MS = 30 * 60 * 1000
PEPPER = os.environ.get('AUTHYNTIC_PEPPER', 'authyntic-pepper')
SESSION_SECRET = os.environ.get('AUTHYNTIC_SESSION_SECRET', 'authyntic-session-secret').encode('utf-8')

APPROVED_USERS = {
    'justin': {
        'display_name': 'Justin',
        'password_hash': '10e7c55132d3bad217aff235c6d4dce89803498cf7526426366922ed070aecb4'
    },
    'zach': {
        'display_name': 'Zach',
        'password_hash': '42560c9c28e3a48b6b9915c3576ea0b9d271a873845ed5a42779205070f1b058'
    }
}


def hash_with_pepper(password: str) -> str:
    value = (PEPPER + password).encode('utf-8')
    return hashlib.sha256(value).hexdigest()


def sign_session_payload(session: dict) -> str:
    payload = json.dumps(session, separators=(',', ':'), sort_keys=True).encode('utf-8')
    return hmac.new(SESSION_SECRET, payload, hashlib.sha256).hexdigest()


class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/session':
            self.handle_session_request()
        else:
            self.send_error(404, "Unsupported endpoint")

    def handle_session_request(self):
        try:
            content_length = int(self.headers.get('Content-Length', '0'))
            raw_body = self.rfile.read(content_length)
            data = json.loads(raw_body.decode('utf-8'))
        except (ValueError, json.JSONDecodeError):
            self.send_json_response(400, {'error': 'Invalid request payload.'})
            return

        username = str(data.get('username', '')).strip().lower()
        password = data.get('password', '')
        csrf_token = str(data.get('csrfToken', '')).strip()
        csrf_header = str(self.headers.get('X-CSRF-Token', '')).strip()

        if not csrf_token or not csrf_header or csrf_token != csrf_header:
            self.send_json_response(400, {'error': 'The security token for this session is invalid or missing. Reload the page and try again.'})
            return

        if not username or not password:
            self.send_json_response(400, {'error': 'Enter both your authorized operator ID and access phrase.'})
            return

        profile = APPROVED_USERS.get(username)
        if not profile:
            time.sleep(0.5)
            self.send_json_response(401, {'error': 'Access denied. The supplied operator ID is not recognized for demo operations.'})
            return

        computed_hash = hash_with_pepper(str(password))
        if not hmac.compare_digest(computed_hash, profile['password_hash']):
            time.sleep(0.5)
            self.send_json_response(401, {'error': 'Access denied. The supplied credentials are invalid.'})
            return

        issued_at = int(time.time() * 1000)
        session = {
            'username': username,
            'displayName': profile['display_name'],
            'issuedAt': issued_at,
            'expiresAt': issued_at + SESSION_DURATION_MS,
            'sessionId': secrets.token_hex(16)
        }
        response = {
            'session': session,
            'signature': sign_session_payload(session)
        }
        self.send_json_response(200, response)

    def send_json_response(self, status_code: int, payload: dict):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

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
