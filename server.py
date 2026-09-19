import http.server
import socketserver
import json
import os
import urllib.parse
import re
import time
import base64
import datetime
import random
import db

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Initialize database on startup
db.init_db()

class ChurchPortalHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path

        # 1. API: Attendance List
        if path == '/api/attendance':
            records = db.get_all_attendance()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            self.wfile.write(json.dumps(records, ensure_ascii=False).encode('utf-8'))
            return

        # 2. API: Live Chat Messages Feed
        if path == '/api/chat' or path == '/bridge_a73c9_messages.php':
            messages = db.get_all_chat_messages(100)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            self.wfile.write(json.dumps(messages, ensure_ascii=False).encode('utf-8'))
            return

        # 3. API: CMS Content
        if path == '/api/content':
            content = db.get_cms_content()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            self.wfile.write(json.dumps(content, ensure_ascii=False).encode('utf-8'))
            return

        # Default static file handler
        return super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.end_headers()

    def do_POST(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path

        # 1. Media & Image Upload API (Supports multipart/form-data for large video/audio & base64 JSON)
        if path == '/api/upload':
            length = int(self.headers.get('Content-Length', 0))
            content_type = self.headers.get('Content-Type', '')
            save_dir = os.path.join(DIRECTORY, 'assets', 'uploaded_media')
            os.makedirs(save_dir, exist_ok=True)

            try:
                if 'multipart/form-data' in content_type:
                    boundary_match = re.search(r'boundary=([^;]+)', content_type)
                    if not boundary_match:
                        raise ValueError("No boundary found in multipart Content-Type")
                    boundary = boundary_match.group(1).strip().strip('"').strip("'").encode('latin1')

                    body = self.rfile.read(length)
                    parts = body.split(b'--' + boundary)
                    saved_filename = None

                    for part in parts:
                        if b'filename=' in part:
                            sep = part.find(b'\r\n\r\n')
                            if sep != -1:
                                header_bytes = part[:sep]
                                file_data = part[sep + 4:]
                                if file_data.endswith(b'\r\n'):
                                    file_data = file_data[:-2]
                                if file_data.endswith(b'--'):
                                    file_data = file_data[:-2]
                                    if file_data.endswith(b'\r\n'):
                                        file_data = file_data[:-2]

                                header_str = header_bytes.decode('latin1', errors='replace')
                                fn_m = re.search(r'filename="?([^";\r\n]+)"?', header_str)
                                raw_fn = fn_m.group(1).strip() if fn_m else f"media_{int(time.time())}.bin"
                                raw_fn = os.path.basename(raw_fn)
                                clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', raw_fn)
                                clean_name = f"{int(time.time())}_{clean_name}"
                                target_path = os.path.join(save_dir, clean_name)
                                with open(target_path, 'wb') as f:
                                    f.write(file_data)
                                saved_filename = clean_name
                                break

                    if not saved_filename:
                        raise ValueError("No file found in multipart upload")

                    rel_url = f'assets/uploaded_media/{saved_filename}'
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({'ok': True, 'url': rel_url, 'filename': saved_filename}).encode('utf-8'))
                    return
                else:
                    body = self.rfile.read(length)
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
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode('utf-8'))
                return

        # 2. Admin Save Content API (Database + JSON Sync)
        if path == '/api/save' or path == '/api/save_content':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body.decode('utf-8'))
                
                # Save to SQLite & content.json
                db.save_cms_content(data)
                
                # Also sync bridge_b73c9_pages.php
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
                self.wfile.write(json.dumps({'ok': True, 'message': 'Content saved to database and files successfully!'}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode('utf-8'))
                return

        # 3. Live Chat Post API (Database + JSON Sync)
        if path == '/oldwebsite/shoutbox.php' or path == '/api/chat':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            content_type = self.headers.get('Content-Type', '')

            if 'application/json' in content_type:
                try:
                    payload = json.loads(body)
                except Exception:
                    payload = {}
                name = payload.get('name', 'Guest')
                shout = payload.get('shout', '')
                date_str = payload.get('date')
            else:
                params = urllib.parse.parse_qs(body)
                name = params.get('name', ['Guest'])[0]
                shout = params.get('shout', [''])[0]
                date_str = params.get('date', [None])[0]

            if not shout.strip():
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': 'Message text is required'}).encode('utf-8'))
                return

            new_msg = db.add_chat_message(name, shout, date_str)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'message': new_msg}).encode('utf-8'))
            return

        # 4. Live Chat Delete API (Admin Moderation)
        if path == '/api/chat/delete':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                payload = json.loads(body)
                msg_id = int(payload.get('id', 0))
                db.delete_chat_message(msg_id)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode('utf-8'))
                return

        # 4b. Live Chat Bulk Delete API
        if path == '/api/chat/bulk_delete':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                payload = json.loads(body)
                msg_ids = [int(i) for i in payload.get('ids', []) if str(i).isdigit()]
                if msg_ids:
                    db.bulk_delete_chat_messages(msg_ids)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True, 'count': len(msg_ids)}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode('utf-8'))
                return

        # 4c. Live Chat Clear All API
        if path == '/api/chat/clear':
            try:
                db.clear_all_chats()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode('utf-8'))
                return

        # 5. Live Attendance Registration API (Database + JSON Sync)
        if path == '/bridge_live_login.php' or path == '/api/attendance' or path == '/api/attendance/manual':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            content_type = self.headers.get('Content-Type', '')
            
            if 'application/json' in content_type:
                try:
                    payload = json.loads(body)
                except Exception:
                    payload = {}
                fullname = payload.get('fullname') or payload.get('name') or 'Guest'
                group = payload.get('group', 'General')
                phone = payload.get('phone', '')
                email = payload.get('email', '')
                category = payload.get('category', 'Church Member')
                viewing_mode = payload.get('viewing_mode', 'individual')
                attendance = payload.get('attendance') or payload.get('count') or 1
                service_name = payload.get('service_name', 'Sunday Service of Excellence')
                platform = payload.get('platform', 'Web App')
                notes = payload.get('notes', '')
            else:
                params = urllib.parse.parse_qs(body)
                fullname = params.get('fullname', ['Guest'])[0]
                group = params.get('group', ['General'])[0]
                phone = params.get('phone', [''])[0]
                email = params.get('email', [''])[0]
                category = params.get('category', ['Church Member'])[0]
                viewing_mode = params.get('viewing_mode', ['individual'])[0]
                attendance = params.get('attendance', ['1'])[0]
                service_name = params.get('service_name', ['Sunday Service of Excellence'])[0]
                platform = params.get('platform', ['Web App'])[0]
                notes = params.get('notes', [''])[0]

            record_data = {
                'name': fullname,
                'category': category,
                'group': group,
                'phone': phone,
                'email': email,
                'viewing_mode': viewing_mode,
                'count': int(attendance) if str(attendance).isdigit() else 1,
                'service_name': service_name,
                'platform': platform,
                'notes': notes
            }

            saved_record = db.add_attendance(record_data)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'ok': True, 
                'record': saved_record, 
                'member': {
                    'name': fullname, 
                    'group': group, 
                    'category': category,
                    'phone': phone,
                    'email': email
                }
            }).encode('utf-8'))
            return

        # 6. Delete Attendance Record API
        if path == '/api/attendance/delete':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                payload = json.loads(body)
                del_id = payload.get('id', '')
                if del_id:
                    db.delete_attendance(del_id)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode('utf-8'))
                return

        # 6b. Bulk Delete Attendance API
        if path == '/api/attendance/bulk_delete':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                payload = json.loads(body)
                del_ids = [str(i) for i in payload.get('ids', []) if str(i).strip()]
                if del_ids:
                    db.bulk_delete_attendance(del_ids)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True, 'count': len(del_ids)}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode('utf-8'))
                return

        # 7. Live Presence API
        if path == '/bridge_live_presence.php':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            # Return active viewer count
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'total': random.randint(18, 35)}).encode('utf-8'))
            return

        # Default fallback
        self.send_response(404)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': 'Not Found'}).encode('utf-8'))

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
