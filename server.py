import http.server
import socketserver
import json
import os
import urllib.parse
import re
import time
import base64

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class ChurchPortalHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path

        # 1. Image Upload API
        if path == '/api/upload':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                payload = json.loads(body.decode('utf-8'))
                raw_data = payload.get('data', '')
                filename = payload.get('filename', f'upload_{int(time.time())}.jpg')
                
                # Sanitize filename
                clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
                clean_name = f"{int(time.time())}_{clean_name}"
                
                if ',' in raw_data:
                    _, b64_str = raw_data.split(',', 1)
                else:
                    b64_str = raw_data
                
                file_bytes = base64.b64decode(b64_str)
                save_dir = os.path.join(DIRECTORY, 'assets', 'uploaded_media')
                os.makedirs(save_dir, exist_ok=True)
                target_path = os.path.join(save_dir, clean_name)
                
                with open(target_path, 'wb') as f:
                    f.write(file_bytes)
                
                rel_url = f'assets/uploaded_media/{clean_name}'
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True, 'url': rel_url}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode('utf-8'))
                return

        # 2. Admin Save Content API
        if path == '/api/save' or path == '/api/save_content':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body.decode('utf-8'))
                
                # Write to assets/data/content.json
                content_path = os.path.join(DIRECTORY, 'assets', 'data', 'content.json')
                os.makedirs(os.path.dirname(content_path), exist_ok=True)
                with open(content_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                # Write to bridge_b73c9_pages.php
                bridge_path = os.path.join(DIRECTORY, 'bridge_b73c9_pages.php')
                with open(bridge_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)

                # Write live notice to bridge_live_notices.php
                if 'live_notice' in data:
                    notice_data = data.get('live_notice', {})
                    notice_path = os.path.join(DIRECTORY, 'bridge_live_notices.php')
                    notice_obj = {
                        'ok': True,
                        'notice': {
                            'id': str(notice_data.get('id', '1')),
                            'title': notice_data.get('title', 'Message from Admin'),
                            'message': notice_data.get('message', '')
                        } if notice_data.get('enabled', False) and notice_data.get('message') else None
                    }
                    with open(notice_path, 'w', encoding='utf-8') as f:
                        json.dump(notice_obj, f, indent=2, ensure_ascii=False)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True, 'message': 'Content saved successfully!'}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode('utf-8'))
                return

        # 3. Live Chat Post API
        if path == '/oldwebsite/shoutbox.php' or path == '/api/chat':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            params = urllib.parse.parse_qs(body)
            name = params.get('name', ['Guest'])[0]
            shout = params.get('shout', [''])[0]
            date = params.get('date', [''])[0]

            msg_file = os.path.join(DIRECTORY, 'bridge_a73c9_messages.php')
            messages = []
            if os.path.exists(msg_file):
                try:
                    with open(msg_file, 'r', encoding='utf-8') as f:
                        messages = json.load(f)
                except Exception:
                    messages = []

            new_msg = {
                'id': len(messages) + 1,
                'name': name,
                'shout': shout,
                'date': date
            }
            messages.append(new_msg)

            with open(msg_file, 'w', encoding='utf-8') as f:
                json.dump(messages[-50:], f, indent=2, ensure_ascii=False)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'message': new_msg}).encode('utf-8'))
            return

        # 4. Live Attendance Login API
        if path == '/bridge_live_login.php' or path == '/api/attendance':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            params = urllib.parse.parse_qs(body)
            fullname = params.get('fullname', ['Guest'])[0]
            group = params.get('group', ['General'])[0]
            phone = params.get('phone', [''])[0]
            email = params.get('email', [''])[0]
            attendance = params.get('attendance', ['1'])[0]

            att_file = os.path.join(DIRECTORY, 'assets', 'data', 'attendance.json')
            records = []
            if os.path.exists(att_file):
                try:
                    with open(att_file, 'r', encoding='utf-8') as f:
                        records = json.load(f)
                except Exception:
                    records = []

            records.append({
                'name': fullname,
                'group': group,
                'phone': phone,
                'email': email,
                'count': attendance,
                'timestamp': urllib.parse.quote(params.get('date', [''])[0] or 'Just now')
            })

            with open(att_file, 'w', encoding='utf-8') as f:
                json.dump(records[-200:], f, indent=2, ensure_ascii=False)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'member': {'name': fullname, 'group': group}}).encode('utf-8'))
            return

        # Default fallback
        super().do_POST()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), ChurchPortalHandler) as httpd:
        print(f"Church Portal Server running on http://localhost:{PORT}")
        httpd.serve_forever()
