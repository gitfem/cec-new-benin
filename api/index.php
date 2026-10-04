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
$routeParam = $_GET['route'] ?? $_GET['action'] ?? '';

$matchRoute = function($name) use ($uri, $routeParam) {
    if ($routeParam === $name) return true;
    return (strpos($uri, '/api/' . $name) !== false) || (strpos($uri, '/' . $name) !== false);
};

// Helper to get request payload (JSON or form-urlencoded)
function getPayload() {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (is_array($json)) return $json;
    }
    if (!empty($_POST['data'])) {
        $json = json_decode($_POST['data'], true);
        if (is_array($json)) return $json;
    }
    return !empty($_POST) ? $_POST : [];
}

// -------------------------------------------------------------
// 1. CMS CONTENT
// -------------------------------------------------------------
if ($method === 'GET' && ($matchRoute('content') || strpos($uri, 'save_content.php') !== false)) {
    if (file_exists($contentFile)) {
        echo file_get_contents($contentFile);
    } else {
        echo json_encode(['site' => ['name' => 'CE New Benin', 'zone' => 'Midwest Zone']]);
    }
    exit;
}

if ($method === 'GET' && (strpos($uri, '/api/youtube/live') !== false || strpos($uri, '/api/youtube_live') !== false || $routeParam === 'youtube_live')) {
    require __DIR__ . '/youtube_live.php';
    exit;
}

// -------------------------------------------------------------
// STREAM LIVE STATUS PROBE
// -------------------------------------------------------------
if ($method === 'GET' && ($matchRoute('stream_status') || $matchRoute('live_status') || $routeParam === 'stream_status')) {
    $url = $_GET['url'] ?? '';
    if (empty($url) && file_exists($contentFile)) {
        $contentData = json_decode(file_get_contents($contentFile), true);
        $url = $contentData['live']['hls_url'] ?? '';
    }
    if (empty($url)) {
        echo json_encode(['ok' => false, 'is_live' => false, 'error' => 'No stream URL provided']);
        exit;
    }

    // Fast HEAD request to the HLS URL to verify manifest freshness
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_NOBODY => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 3,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT => 'CEC-Benin-LiveProbe/1.0'
    ]);
    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || empty($resp)) {
        echo json_encode(['ok' => true, 'is_live' => false, 'http_code' => $httpCode, 'reason' => 'Stream offline or unreachable']);
        exit;
    }

    $lastModified = null;
    if (preg_match('/Last-Modified:\s*([^\r\n]+)/i', $resp, $m)) {
        $lastModified = trim($m[1]);
    }

    $age = null;
    $isLive = false;
    if ($lastModified) {
        $ts = strtotime($lastModified);
        if ($ts !== false) {
            $age = time() - $ts;
            // Active live stream updates manifest every segment (4-7s).
            // If manifest hasn't updated in > 25 seconds, broadcast has stopped!
            $isLive = ($age <= 25);
        }
    } else {
        // Fallback: fetch manifest body
        $ch2 = curl_init($url);
        curl_setopt_array($ch2, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 3,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'CEC-Benin-LiveProbe/1.0'
        ]);
        $body = curl_exec($ch2);
        curl_close($ch2);
        $isLive = ($body && strpos($body, '#EXT-X-ENDLIST') === false && strpos($body, '.ts') !== false);
    }

    echo json_encode([
        'ok' => true,
        'is_live' => $isLive,
        'age_seconds' => $age,
        'last_modified' => $lastModified,
        'http_code' => $httpCode
    ]);
    exit;
}

if ($method === 'POST' && ($matchRoute('save') || $matchRoute('save_content') || strpos($uri, 'save_content.php') !== false)) {
    $data = getPayload();
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'No content payload provided']);
        exit;
    }
    
    $jsonString = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    // Save to content.json
    $saved = file_put_contents($contentFile, $jsonString);
    
    // Sync bridge_b73c9_pages.php
    $bridgePages = $baseDir . '/bridge_b73c9_pages.php';
    @file_put_contents($bridgePages, $jsonString);
    
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
        @file_put_contents($baseDir . '/bridge_live_notices.php', json_encode($noticeObj, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    // Sync SQLite church.db if available
    try {
        if (extension_loaded('pdo_sqlite') || class_exists('PDO')) {
            $pdo = new PDO('sqlite:' . $dbFile);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("CREATE TABLE IF NOT EXISTS cms_content (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, data TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
            $stmt = $pdo->prepare("INSERT OR REPLACE INTO cms_content (key, data, updated_at) VALUES ('main', :data, datetime('now'))");
            $stmt->execute([':data' => $jsonString]);
        }
    } catch (Exception $e) {
        // Non-fatal, content.json is primary
    }

    if ($saved === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Permission denied: unable to write to content.json']);
        exit;
    }

    echo json_encode(['ok' => true, 'message' => 'Content saved successfully!']);
    exit;
}

// -------------------------------------------------------------
// 2. LIVE ATTENDANCE REGISTER
// -------------------------------------------------------------
if ($method === 'GET' && (strpos($uri, '/api/attendance') !== false || strpos($uri, '/bridge_live_login.php') !== false)) {
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
    $name = trim($p['fullname'] ?? $p['name'] ?? 'Guest');
    $group = trim($p['group'] ?? 'Christ Embassy Lagos Street');
    $phoneRaw = trim($p['phone'] ?? '');
    $emailRaw = trim($p['email'] ?? '');

    // Validate Phone (local or international)
    $phoneCleaned = preg_replace('/[\s\-\(\)\.]/', '', $phoneRaw);
    if (!preg_match('/^\+?[0-9]{8,15}$/', $phoneCleaned)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Phone number must be between 8 and 15 digits (local or international format).']);
        exit;
    }
    $digitsOnly = ltrim($phoneCleaned, '+');
    if (preg_match('/^(\d)\1+$/', $digitsOnly)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Please enter an active phone number, not repeated digits.']);
        exit;
    }
    $dummySeq = ['12345678', '87654321', '01234567', '76543210', '98765432'];
    foreach ($dummySeq as $seq) {
        if (strpos($digitsOnly, $seq) !== false) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Please enter an active phone number, not a sequential test number.']);
            exit;
        }
    }
    if (count(count_chars($digitsOnly, 1)) < 3) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Please enter a genuine active phone number.']);
        exit;
    }
    if (strpos($phoneCleaned, '0') === 0) {
        if (strlen($phoneCleaned) !== 11 || !preg_match('/^0(?:[789][01]\d{8}|[1-9]\d{7,8})$/', $phoneCleaned)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Local Nigerian phone numbers must be 11 digits with a valid prefix (e.g. 08023456789).']);
            exit;
        }
        $sub = substr($phoneCleaned, 3);
        if (preg_match('/^(\d)\1+$/', $sub)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Please enter an active phone number.']);
            exit;
        }
        $phone = $phoneCleaned;
    } elseif (strpos($phoneCleaned, '+234') === 0 || strpos($phoneCleaned, '234') === 0) {
        $norm = (strpos($phoneCleaned, '+234') === 0) ? substr($phoneCleaned, 4) : substr($phoneCleaned, 3);
        if (strpos($norm, '0') === 0) $norm = substr($norm, 1);
        if (strlen($norm) !== 10 || !preg_match('/^[789][01]\d{8}$|^[1-9]\d{7,8}$/', $norm)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid Nigerian phone number format after +234.']);
            exit;
        }
        $phone = '+234' . $norm;
    } else {
        $phone = $phoneCleaned;
    }

    // Validate Email if entered
    $email = strtolower($emailRaw);
    if ($email !== '') {
        $placeholders = ['name@email.com', 'you@example.com', 'johndoe@gmail.com', 'email@email.com'];
        if (in_array($email, $placeholders, true) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Please enter a valid email address (e.g. name@domain.com).']);
            exit;
        }
        $parts = explode('@', $email, 2);
        $user = $parts[0] ?? '';
        $domain = $parts[1] ?? '';
        $dummyUsers = ['test', 'testing', 'fake', 'none', 'noemail', 'dummy', 'asdf', 'sample', 'random', 'fakemail'];
        if (in_array($user, $dummyUsers, true) || (strlen($user) >= 4 && preg_match('/^([a-z0-9])\1+$/', $user))) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Please enter an active email address, not a dummy or test email.']);
            exit;
        }
        $fakeDomains = ['test.com', 'fake.com', 'none.com', 'domain.com', 'sample.com', 'noemail.com', 'mailinator.com', 'tempmail.com', 'example.com', 'example.org'];
        if (in_array($domain, $fakeDomains, true)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => "\"$domain\" is not an active email provider. Please use your active email."]);
            exit;
        }
    }

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
if ($method === 'GET' && (strpos($uri, '/api/chat') !== false || strpos($uri, '/bridge_a73c9_messages.php') !== false || strpos($uri, '/oldwebsite/shoutbox.php') !== false)) {
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

if ($method === 'POST' && (strpos($uri, '/api/chat') !== false || strpos($uri, '/oldwebsite/shoutbox.php') !== false || strpos($uri, '/bridge_a73c9_messages.php') !== false)) {
    $p = getPayload();
    $name = trim($p['name'] ?? 'Guest');
    $shout = trim($p['shout'] ?? $p['message'] ?? $p['text'] ?? '');
    $dateStr = $p['date'] ?? date('jS M, Y H:i');

    if (empty($shout)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Message text is required']);
        exit;
    }

    $chats = file_exists($chatFile) ? json_decode(file_get_contents($chatFile), true) : [];
    if (!is_array($chats)) $chats = [];

    $maxId = 0;
    foreach ($chats as $c) {
        $mid = intval($c['id'] ?? 0);
        if ($mid > $maxId) $maxId = $mid;
    }

    $newMsg = [
        'id' => (string)($maxId + 1),
        'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
        'shout' => htmlspecialchars($shout, ENT_QUOTES, 'UTF-8'),
        'date' => $dateStr
    ];

    $chats[] = $newMsg;
    if (count($chats) > 150) {
        $chats = array_slice($chats, -150);
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
