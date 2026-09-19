<?php
/**
 * Christ Embassy New Benin - Production Unified API Handler
 * Supports:
 *  - GET  /api/content
 *  - POST /api/save (or /api/save_content)
 *  - GET  /api/attendance
 *  - POST /api/attendance (or /bridge_live_login.php, /api/attendance/manual)
 *  - POST /api/attendance/delete
 *  - POST /api/attendance/bulk_delete
 *  - GET  /api/chat (or /api/livechat, /bridge_a73c9_messages.php)
 *  - POST /api/chat (or /oldwebsite/shoutbox.php)
 *  - POST /api/chat/delete
 *  - POST /api/chat/bulk_delete
 *  - POST /api/chat/clear
 *  - POST /api/upload
 */

// Headers & CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Increase memory & execution limits for uploads
@ini_set('upload_max_filesize', '500M');
@ini_set('post_max_size', '500M');
@ini_set('memory_limit', '512M');
@ini_set('max_execution_time', '300');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$baseDir = dirname(__DIR__);
$dataDir = $baseDir . '/assets/data';
$uploadDir = $baseDir . '/assets/uploaded_media';
@mkdir($dataDir, 0777, true);
@mkdir($uploadDir, 0777, true);

$contentFile = $dataDir . '/content.json';
$attendanceFile = $dataDir . '/attendance.json';
$chatFile = $dataDir . '/chat_messages.json';
$dbFile = $dataDir . '/church.db';

// Ensure data files exist
if (!file_exists($attendanceFile)) {
    file_put_contents($attendanceFile, '[]');
}
if (!file_exists($chatFile)) {
    file_put_contents($chatFile, '[]');
}

// Determine route
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Helper to get request payload (JSON or form-urlencoded)
function getPayload() {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (is_array($json)) return $json;
    }
    return !empty($_POST) ? $_POST : [];
}

// -------------------------------------------------------------
// 1. CMS CONTENT
// -------------------------------------------------------------
if ($method === 'GET' && (strpos($uri, '/api/content') !== false)) {
    if (file_exists($contentFile)) {
        echo file_get_contents($contentFile);
    } else {
        echo json_encode(['site' => ['name' => 'Christ Embassy New Benin']]);
    }
    exit;
}

if ($method === 'POST' && (strpos($uri, '/api/save') !== false || strpos($uri, '/api/save_content') !== false)) {
    $data = getPayload();
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'No content payload provided']);
        exit;
    }
    
    // Save to content.json
    file_put_contents($contentFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    // Sync bridge_b73c9_pages.php
    $bridgePages = $baseDir . '/bridge_b73c9_pages.php';
    file_put_contents($bridgePages, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    // Sync live notices if present
    if (!empty($data['live_notice'])) {
        $notice = $data['live_notice'];
        $noticeObj = [
            'ok' => true,
            'notice' => (!empty($notice['enabled']) && !empty($notice['message'])) ? [
                'id' => (string)($notice['id'] ?? '1'),
                'title' => $notice['title'] ?? 'Message from Admin',
                'message' => $notice['message'] ?? ''
            ] : null
        ];
        file_put_contents($baseDir . '/bridge_live_notices.php', json_encode($noticeObj, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    echo json_encode(['ok' => true, 'message' => 'Content saved successfully!']);
    exit;
}

// -------------------------------------------------------------
// 2. LIVE ATTENDANCE REGISTER
// -------------------------------------------------------------
if ($method === 'GET' && strpos($uri, '/api/attendance') !== false) {
    if (file_exists($attendanceFile)) {
        echo file_get_contents($attendanceFile);
    } else {
        echo '[]';
    }
    exit;
}

if ($method === 'POST' && (strpos($uri, '/api/attendance/bulk_delete') !== false)) {
    $payload = getPayload();
    $ids = $payload['ids'] ?? [];
    $records = file_exists($attendanceFile) ? json_decode(file_get_contents($attendanceFile), true) : [];
    if (!is_array($records)) $records = [];
    
    $idSet = array_flip($ids);
    $newRecords = array_values(array_filter($records, function($r) use ($idSet) {
        return !isset($idSet[$r['id'] ?? '']);
    }));
    
    file_put_contents($attendanceFile, json_encode($newRecords, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['ok' => true, 'count' => count($ids)]);
    exit;
}

if ($method === 'POST' && (strpos($uri, '/api/attendance/delete') !== false)) {
    $payload = getPayload();
    $id = $payload['id'] ?? '';
    $records = file_exists($attendanceFile) ? json_decode(file_get_contents($attendanceFile), true) : [];
    if (!is_array($records)) $records = [];
    
    $newRecords = array_values(array_filter($records, function($r) use ($id) {
        return ($r['id'] ?? '') !== $id;
    }));
    
    file_put_contents($attendanceFile, json_encode($newRecords, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['ok' => true]);
    exit;
}

if ($method === 'POST' && (strpos($uri, '/api/attendance') !== false || strpos($uri, '/bridge_live_login.php') !== false)) {
    $p = getPayload();
    $name = $p['fullname'] ?? $p['name'] ?? 'Guest';
    $group = $p['group'] ?? 'Christ Embassy Lagos Street';
    $phone = $p['phone'] ?? '';
    $email = $p['email'] ?? '';
    $category = $p['category'] ?? 'Church Member';
    $viewing_mode = $p['viewing_mode'] ?? 'individual';
    $count = intval($p['attendance'] ?? $p['count'] ?? 1);
    if ($count < 1) $count = 1;
    $service_name = $p['service_name'] ?? 'Sunday Service of Excellence';
    $platform = $p['platform'] ?? 'Web App';
    $notes = $p['notes'] ?? '';

    $newRecord = [
        'id' => uniqid('att_'),
        'service_name' => $service_name,
        'date' => date('Y-m-d'),
        'time' => date('h:i A'),
        'name' => $name,
        'category' => $category,
        'group' => $group,
        'phone' => $phone,
        'email' => $email,
        'count' => $count,
        'viewing_mode' => $viewing_mode,
        'platform' => $platform,
        'notes' => $notes,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    $records = file_exists($attendanceFile) ? json_decode(file_get_contents($attendanceFile), true) : [];
    if (!is_array($records)) $records = [];
    array_unshift($records, $newRecord);
    file_put_contents($attendanceFile, json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode(['ok' => true, 'record' => $newRecord]);
    exit;
}

// -------------------------------------------------------------
// 3. LIVE CHAT MODERATION & FEED
// -------------------------------------------------------------
if ($method === 'GET' && (strpos($uri, '/api/chat') !== false || strpos($uri, '/bridge_a73c9_messages.php') !== false)) {
    if (file_exists($chatFile)) {
        echo file_get_contents($chatFile);
    } else {
        echo '[]';
    }
    exit;
}

if ($method === 'POST' && strpos($uri, '/api/chat/delete') !== false) {
    $p = getPayload();
    $id = intval($p['id'] ?? 0);
    $chats = file_exists($chatFile) ? json_decode(file_get_contents($chatFile), true) : [];
    if (!is_array($chats)) $chats = [];
    
    $chats = array_values(array_filter($chats, function($m) use ($id) {
        return intval($m['id'] ?? 0) !== $id;
    }));
    file_put_contents($chatFile, json_encode($chats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['ok' => true]);
    exit;
}

if ($method === 'POST' && strpos($uri, '/api/chat/bulk_delete') !== false) {
    $p = getPayload();
    $ids = array_map('intval', $p['ids'] ?? []);
    $idSet = array_flip($ids);
    $chats = file_exists($chatFile) ? json_decode(file_get_contents($chatFile), true) : [];
    if (!is_array($chats)) $chats = [];
    
    $chats = array_values(array_filter($chats, function($m) use ($idSet) {
        return !isset($idSet[intval($m['id'] ?? 0)]);
    }));
    file_put_contents($chatFile, json_encode($chats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['ok' => true, 'count' => count($ids)]);
    exit;
}

if ($method === 'POST' && strpos($uri, '/api/chat/clear') !== false) {
    file_put_contents($chatFile, '[]');
    echo json_encode(['ok' => true]);
    exit;
}

if ($method === 'POST' && (strpos($uri, '/api/chat') !== false || strpos($uri, '/oldwebsite/shoutbox.php') !== false)) {
    $p = getPayload();
    $name = trim($p['name'] ?? 'Guest');
    $shout = trim($p['shout'] ?? '');
    $dateStr = $p['date'] ?? date('jS M, Y H:i');

    if (empty($shout)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Message text is required']);
        exit;
    }

    $chats = file_exists($chatFile) ? json_decode(file_get_contents($chatFile), true) : [];
    if (!is_array($chats)) $chats = [];

    $newId = count($chats) > 0 ? (max(array_column($chats, 'id')) + 1) : 1;
    $newMsg = [
        'id' => (string)$newId,
        'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
        'shout' => htmlspecialchars($shout, ENT_QUOTES, 'UTF-8'),
        'date' => $dateStr
    ];

    array_unshift($chats, $newMsg);
    if (count($chats) > 200) {
        $chats = array_slice($chats, 0, 200);
    }
    file_put_contents($chatFile, json_encode($chats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode(['ok' => true, 'message' => $newMsg]);
    exit;
}

// -------------------------------------------------------------
// 4. MEDIA & FILE UPLOADER (Multipart & Base64)
// -------------------------------------------------------------
if ($method === 'POST' && strpos($uri, '/api/upload') !== false) {
    // 1. Multipart file upload
    if (!empty($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
        $origName = !empty($_POST['filename']) ? $_POST['filename'] : $_FILES['file']['name'];
        $cleanName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $origName);
        $cleanName = time() . '_' . $cleanName;
        $targetPath = $uploadDir . '/' . $cleanName;
        
        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
            echo json_encode([
                'ok' => true,
                'url' => 'assets/uploaded_media/' . $cleanName,
                'filename' => $cleanName
            ]);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Failed to write uploaded file']);
            exit;
        }
    }

    // 2. Base64 JSON payload
    $payload = getPayload();
    if (!empty($payload['data'])) {
        $filename = $payload['filename'] ?? ('upload_' . time() . '.bin');
        $cleanName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $filename);
        $cleanName = time() . '_' . $cleanName;

        $b64 = $payload['data'];
        if (strpos($b64, ',') !== false) {
            list(, $b64) = explode(',', $b64);
        }

        $fileBytes = base64_decode($b64);
        if ($fileBytes !== false) {
            $targetPath = $uploadDir . '/' . $cleanName;
            file_put_contents($targetPath, $fileBytes);
            echo json_encode([
                'ok' => true,
                'url' => 'assets/uploaded_media/' . $cleanName,
                'filename' => $cleanName
            ]);
            exit;
        }
    }

    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'No valid file data received']);
    exit;
}

// Fallback
http_response_code(404);
echo json_encode(['ok' => false, 'error' => 'Endpoint not found']);
