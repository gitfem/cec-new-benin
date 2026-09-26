import sqlite3
import os
import json
import datetime
import random

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIRECTORY, 'assets', 'data')
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, 'church.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    
    # 1. Attendance Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT DEFAULT 'Church Member',
            group_name TEXT DEFAULT 'General',
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
            viewing_mode TEXT DEFAULT 'individual',
            count INTEGER DEFAULT 1,
            service_name TEXT DEFAULT 'Sunday Service of Excellence',
            date TEXT DEFAULT '',
            time TEXT DEFAULT '',
            timestamp TEXT DEFAULT '',
            platform TEXT DEFAULT 'Web App',
            notes TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. Live Chat Messages Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            shout TEXT NOT NULL,
            date TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 3. CMS Content Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS cms_content (
            key TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    
    # Seed attendance from JSON if empty
    c.execute('SELECT COUNT(*) FROM attendance')
    if c.fetchone()[0] == 0:
        att_json_path = os.path.join(DATA_DIR, 'attendance.json')
        if os.path.exists(att_json_path):
            try:
                with open(att_json_path, 'r', encoding='utf-8') as f:
                    records = json.load(f)
                for r in records:
                    c.execute('''
                        INSERT OR REPLACE INTO attendance 
                        (id, name, category, group_name, phone, email, viewing_mode, count, service_name, date, time, timestamp, platform, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        r.get('id', f"ATT-{random.randint(1000,9999)}"),
                        r.get('name', 'Guest'),
                        r.get('category', 'Church Member'),
                        r.get('group', 'General'),
                        r.get('phone', ''),
                        r.get('email', ''),
                        r.get('viewing_mode', 'individual'),
                        int(r.get('count', 1)),
                        r.get('service_name', 'Sunday Service of Excellence'),
                        r.get('date', ''),
                        r.get('time', ''),
                        r.get('timestamp', ''),
                        r.get('platform', 'Web App'),
                        r.get('notes', '')
                    ))
                conn.commit()
            except Exception as e:
                print(f"Error seeding attendance: {e}")
                
    # Seed chat from JSON if empty
    c.execute('SELECT COUNT(*) FROM chat_messages')
    if c.fetchone()[0] == 0:
        chat_json_path = os.path.join(DATA_DIR, 'chat_messages.json')
        if os.path.exists(chat_json_path):
            try:
                with open(chat_json_path, 'r', encoding='utf-8') as f:
                    chats = json.load(f)
                for m in chats:
                    c.execute('''
                        INSERT INTO chat_messages (id, name, shout, date)
                        VALUES (?, ?, ?, ?)
                    ''', (
                        m.get('id'),
                        m.get('name', 'Guest'),
                        m.get('shout', ''),
                        m.get('date', '')
                    ))
                conn.commit()
            except Exception as e:
                print(f"Error seeding chat: {e}")
                
    # Seed CMS content from content.json if empty
    c.execute('SELECT COUNT(*) FROM cms_content')
    if c.fetchone()[0] == 0:
        content_json_path = os.path.join(DATA_DIR, 'content.json')
        if os.path.exists(content_json_path):
            try:
                with open(content_json_path, 'r', encoding='utf-8') as f:
                    content_data = f.read()
                c.execute('INSERT OR REPLACE INTO cms_content (key, data) VALUES (?, ?)', ('main', content_data))
                conn.commit()
            except Exception as e:
                print(f"Error seeding content: {e}")
                
    conn.close()

# Attendance operations
def get_all_attendance():
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM attendance ORDER BY created_at DESC, id DESC')
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    # Normalize field name for group
    for r in rows:
        r['group'] = r.get('group_name', '')
    return rows

def add_attendance(data):
    conn = get_db()
    c = conn.cursor()
    now = datetime.datetime.now()
    rec_id = data.get('id') or f"ATT-{now.strftime('%Y%m%d%H%M%S')}-{random.randint(100, 999)}"
    date_str = data.get('date') or now.strftime('%Y-%m-%d')
    time_str = data.get('time') or now.strftime('%I:%M %p')
    timestamp_str = data.get('timestamp') or now.strftime('%b %d, %Y - %I:%M %p')
    
    count_val = int(data.get('count') or data.get('attendance') or 1)
    
    c.execute('''
        INSERT OR REPLACE INTO attendance
        (id, name, category, group_name, phone, email, viewing_mode, count, service_name, date, time, timestamp, platform, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        rec_id,
        data.get('name') or data.get('fullname') or 'Guest',
        data.get('category', 'Church Member'),
        data.get('group', 'General'),
        data.get('phone', ''),
        data.get('email', ''),
        data.get('viewing_mode', 'individual'),
        count_val,
        data.get('service_name', 'Sunday Service of Excellence'),
        date_str,
        time_str,
        timestamp_str,
        data.get('platform', 'Web App'),
        data.get('notes', '')
    ))
    conn.commit()
    conn.close()
    
    # Sync to attendance.json
    sync_attendance_json()
    
    record = dict(data)
    record.update({
        'id': rec_id,
        'count': count_val,
        'date': date_str,
        'time': time_str,
        'timestamp': timestamp_str
    })
    return record

def delete_attendance(rec_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM attendance WHERE id = ?', (rec_id,))
    conn.commit()
    conn.close()
    sync_attendance_json()

def bulk_delete_attendance(rec_ids):
    if not rec_ids:
        return
    conn = get_db()
    c = conn.cursor()
    placeholders = ','.join(['?'] * len(rec_ids))
    c.execute(f'DELETE FROM attendance WHERE id IN ({placeholders})', rec_ids)
    conn.commit()
    conn.close()
    sync_attendance_json()

def sync_attendance_json():
    rows = get_all_attendance()
    att_file = os.path.join(DATA_DIR, 'attendance.json')
    try:
        with open(att_file, 'w', encoding='utf-8') as f:
            json.dump(rows, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error syncing attendance.json: {e}")

# Live chat operations
def get_all_chat_messages(limit=100):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, name, shout, date FROM chat_messages ORDER BY id ASC LIMIT ?', (limit,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows

def add_chat_message(name, shout, date_str=None):
    if not date_str:
        now = datetime.datetime.now()
        date_str = now.strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db()
    c = conn.cursor()
    c.execute('INSERT INTO chat_messages (name, shout, date) VALUES (?, ?, ?)', (name, shout, date_str))
    msg_id = c.lastrowid
    conn.commit()
    conn.close()
    
    new_msg = {'id': msg_id, 'name': name, 'shout': shout, 'date': date_str}
    sync_chat_json()
    return new_msg

def sync_chat_json():
    messages = get_all_chat_messages()
    chat_file = os.path.join(DATA_DIR, 'chat_messages.json')
    bridge_msg_file = os.path.join(DIRECTORY, 'bridge_a73c9_messages.php')
    try:
        with open(chat_file, 'w', encoding='utf-8') as f:
            json.dump(messages[-60:], f, indent=2, ensure_ascii=False)
        # Also sync to bridge file for legacy support
        with open(bridge_msg_file, 'w', encoding='utf-8') as f:
            json.dump(messages[-60:], f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error syncing chat files: {e}")

def delete_chat_message(msg_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM chat_messages WHERE id = ?', (msg_id,))
    conn.commit()
    conn.close()
    sync_chat_json()

def bulk_delete_chat_messages(msg_ids):
    if not msg_ids:
        return
    conn = get_db()
    c = conn.cursor()
    placeholders = ','.join(['?'] * len(msg_ids))
    c.execute(f'DELETE FROM chat_messages WHERE id IN ({placeholders})', msg_ids)
    conn.commit()
    conn.close()
    sync_chat_json()

def clear_all_chats():
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM chat_messages')
    conn.commit()
    conn.close()
    sync_chat_json()

# CMS content operations
def get_cms_content():
    content_file = os.path.join(DATA_DIR, 'content.json')
    file_data = None
    if os.path.exists(content_file):
        try:
            with open(content_file, 'r', encoding='utf-8') as f:
                file_data = json.load(f)
        except Exception:
            pass

    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT data FROM cms_content WHERE key = ?', ('main',))
    row = c.fetchone()
    conn.close()

    if file_data and isinstance(file_data, dict) and file_data:
        # Keep SQLite synced if it was missing or stale
        try:
            if not row or json.loads(row['data']) != file_data:
                save_cms_content(file_data)
        except Exception:
            pass
        return file_data

    if row:
        try:
            return json.loads(row['data'])
        except Exception:
            pass

    return {}

def save_cms_content(content_dict):
    data_str = json.dumps(content_dict, indent=2, ensure_ascii=False)
    conn = get_db()
    c = conn.cursor()
    c.execute('INSERT OR REPLACE INTO cms_content (key, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', ('main', data_str))
    conn.commit()
    conn.close()
    
    # Sync to content.json
    content_file = os.path.join(DATA_DIR, 'content.json')
    with open(content_file, 'w', encoding='utf-8') as f:
        f.write(data_str)

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully at:", DB_PATH)
    print("Total attendance records:", len(get_all_attendance()))
    print("Total chat messages:", len(get_all_chat_messages()))
