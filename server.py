#!/usr/bin/env python3
"""Development server with hardened authentication endpoint."""

from __future__ import annotations

import collections
import hashlib
import hmac
import http.server
import json
import logging
import os
import secrets
import socketserver
import time
from http import cookies
from typing import Dict, Iterable, List, Optional

SESSION_DURATION_MS = 30 * 60 * 1000
PEPPER = os.environ.get('AUTHYNTIC_PEPPER', 'authyntic-pepper')
SESSION_SECRET = os.environ.get('AUTHYNTIC_SESSION_SECRET', 'authyntic-session-secret').encode('utf-8')
SESSION_COOKIE_NAME = 'authyntic_session'
SESSION_COOKIE_SECURE = os.environ.get('AUTHYNTIC_COOKIE_SECURE', '0') != '0'

RATE_LIMIT_MAX_ATTEMPTS = int(os.environ.get('AUTHYNTIC_RATE_LIMIT_MAX', '6'))
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get('AUTHYNTIC_RATE_LIMIT_WINDOW', '120'))

ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get('AUTHYNTIC_ALLOWED_ORIGINS', 'http://localhost:8000').split(',')
    if origin.strip()
}
DEFAULT_ALLOWED_ORIGIN = next(iter(ALLOWED_ORIGINS), 'http://localhost:8000')

APPROVED_USERS: Dict[str, Dict[str, str | List[str]]] = {
    'justin': {
        'display_name': 'Justin',
        'password_hash': '10e7c55132d3bad217aff235c6d4dce89803498cf7526426366922ed070aecb4',
        'roles': ['operator', 'commander'],
    },
    'zach': {
        'display_name': 'Zach',
        'password_hash': '42560c9c28e3a48b6b9915c3576ea0b9d271a873845ed5a42779205070f1b058',
        'roles': ['operator', 'analyst'],
    },
}

ACTIVE_SESSIONS: Dict[str, Dict[str, int | str]] = {}

LOGGER = logging.getLogger('authyntic.server')


def hash_with_pepper(password: str) -> str:
    value = (PEPPER + password).encode('utf-8')
    return hashlib.sha256(value).hexdigest()


def sign_session_payload(session: dict) -> str:
    payload = json.dumps(session, separators=(',', ':'), sort_keys=True).encode('utf-8')
    return hmac.new(SESSION_SECRET, payload, hashlib.sha256).hexdigest()


def cleanup_sessions() -> None:
    now_ms = int(time.time() * 1000)
    expired = [session_id for session_id, record in ACTIVE_SESSIONS.items() if record['expires_at'] <= now_ms]
    for session_id in expired:
        ACTIVE_SESSIONS.pop(session_id, None)


def issue_session(username: str, profile: Dict[str, str | List[str]]) -> dict:
    cleanup_sessions()
    issued_at = int(time.time() * 1000)
    session_id = secrets.token_hex(16)
    roles = profile.get('roles', [])
    session = {
        'username': username,
        'displayName': profile.get('display_name', username.title()),
        'issuedAt': issued_at,
        'expiresAt': issued_at + SESSION_DURATION_MS,
        'sessionId': session_id,
        'roles': roles,
    }
    ACTIVE_SESSIONS[session_id] = {
        'username': username,
        'expires_at': session['expiresAt'],
    }
    return session


class SecureHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with enhanced security and observability."""

    rate_limits: Dict[str, List[float]] = collections.defaultdict(list)
    protocol_version = 'HTTP/1.1'

    def end_headers(self) -> None:  # type: ignore[override]
        origin = self.headers.get('Origin')
        allowed_origin = origin if origin in ALLOWED_ORIGINS else DEFAULT_ALLOWED_ORIGIN
        self.send_header('Access-Control-Allow-Origin', allowed_origin)
        self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        if self.path.startswith('/api/') or self.command in {'POST', 'OPTIONS'}:
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        else:
            self.send_header('Cache-Control', 'public, max-age=600, stale-while-revalidate=180')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Permissions-Policy', 'interest-cohort=()')
        self.send_header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
        super().end_headers()

    def do_OPTIONS(self) -> None:  # type: ignore[override]
        self.send_response(204)
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def do_POST(self) -> None:  # type: ignore[override]
        if self.path == '/api/session':
            self.handle_session_request()
        else:
            self.send_error(404, 'Unsupported endpoint')

    def handle_session_request(self) -> None:
        client_ip = self.client_address[0]
        if not self._check_rate_limit(client_ip):
            LOGGER.warning('Rate limit exceeded for %s', client_ip)
            self.send_json_response(429, {'error': 'Too many authentication attempts. Please wait and try again.'})
            return

        try:
            content_length = int(self.headers.get('Content-Length', '0'))
            raw_body = self.rfile.read(content_length)
            data = json.loads(raw_body.decode('utf-8'))
        except (ValueError, json.JSONDecodeError):
            self._register_rate_limit(client_ip)
            self.send_json_response(400, {'error': 'Invalid request payload.'})
            return

        username = str(data.get('username', '')).strip().lower()
        password = data.get('password', '')
        csrf_token = str(data.get('csrfToken', '')).strip()
        csrf_header = str(self.headers.get('X-CSRF-Token', '')).strip()

        if not csrf_token or not csrf_header or csrf_token != csrf_header:
            self._register_rate_limit(client_ip)
            self.send_json_response(400, {
                'error': 'The security token for this session is invalid or missing. Reload the page and try again.'
            })
            return

        if not username or not password:
            self._register_rate_limit(client_ip)
            self.send_json_response(400, {'error': 'Enter both your authorized operator ID and access phrase.'})
            return

        profile = APPROVED_USERS.get(username)
        if not profile:
            time.sleep(0.5)
            self._register_rate_limit(client_ip)
            self.send_json_response(401, {'error': 'Access denied. The supplied operator ID is not recognized for demo operations.'})
            return

        computed_hash = hash_with_pepper(str(password))
        if not hmac.compare_digest(computed_hash, profile['password_hash']):
            time.sleep(0.5)
            self._register_rate_limit(client_ip)
            self.send_json_response(401, {'error': 'Access denied. The supplied credentials are invalid.'})
            return

        session = issue_session(username, profile)
        response = {
            'session': session,
            'signature': sign_session_payload(session),
        }
        cookie_header = self._build_session_cookie(session['sessionId'], session['expiresAt'])
        headers = {'Set-Cookie': [cookie_header]} if cookie_header else None
        self._reset_rate_limit(client_ip)
        LOGGER.info('Issued session for %s', username)
        self.send_json_response(200, response, headers=headers)

    def _build_session_cookie(self, session_id: str, expires_at: int) -> str:
        cookie = cookies.SimpleCookie()
        cookie[SESSION_COOKIE_NAME] = session_id
        morsel = cookie[SESSION_COOKIE_NAME]
        morsel['httponly'] = True
        morsel['path'] = '/'
        morsel['samesite'] = 'Strict'
        morsel['max-age'] = str(int(SESSION_DURATION_MS / 1000))
        morsel['expires'] = time.strftime('%a, %d-%b-%Y %H:%M:%S GMT', time.gmtime(int(expires_at / 1000)))
        if SESSION_COOKIE_SECURE:
            morsel['secure'] = True
        return cookie.output(header='').strip()

    def _check_rate_limit(self, key: str) -> bool:
        bucket = self._prune_rate_bucket(key)
        return len(bucket) < RATE_LIMIT_MAX_ATTEMPTS

    def _register_rate_limit(self, key: str) -> None:
        bucket = self._prune_rate_bucket(key)
        bucket.append(time.time())
        self.rate_limits[key] = bucket

    def _reset_rate_limit(self, key: str) -> None:
        self.rate_limits.pop(key, None)

    def _prune_rate_bucket(self, key: str) -> List[float]:
        now = time.time()
        bucket = [ts for ts in self.rate_limits.get(key, []) if now - ts < RATE_LIMIT_WINDOW_SECONDS]
        if bucket:
            self.rate_limits[key] = bucket
        else:
            self.rate_limits.pop(key, None)
        return bucket

    def send_json_response(self, status_code: int, payload: dict, headers: Optional[Dict[str, Iterable[str]]] = None) -> None:
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status_code)
        if headers:
            for key, value in headers.items():
                if isinstance(value, (list, tuple, set)):
                    for item in value:
                        self.send_header(key, item)
                else:
                    self.send_header(key, str(value))
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def guess_type(self, path: str) -> str:  # type: ignore[override]
        if path.endswith('.json'):
            return 'application/json'
        return super().guess_type(path)

    def log_message(self, fmt: str, *args) -> None:  # type: ignore[override]
        LOGGER.info('%s - - [%s] %s', self.client_address[0], self.log_date_time_string(), fmt % args)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s %(name)s: %(message)s')
    port = int(os.environ.get('PORT', '8000'))
    handler = SecureHTTPRequestHandler

    with socketserver.TCPServer(('', port), handler) as httpd:
        LOGGER.info('Serving with hardened security controls at http://localhost:%s', port)
        httpd.serve_forever()


if __name__ == '__main__':
    main()
