<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: no-cache, no-store, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dir = dirname(__DIR__);
$contentFile = $dir . '/assets/data/content.json';
$bridgeFile = $dir . '/bridge_b73c9_pages.php';
$bridgeNotices = $dir . '/bridge_live_notices.php';
$dbFile = $dir . '/assets/data/church.db';

// Support GET to fetch content directly
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($contentFile)) {
        echo file_get_contents($contentFile);
    } else {
        echo json_encode(['site' => ['name' => 'CE New Benin', 'zone' => 'Midwest Zone']]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || !is_array($data)) {
    if (!empty($_POST['data'])) {
        $data = json_decode($_POST['data'], true);
    } elseif (!empty($_POST)) {
        $data = $_POST;
    }
}

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid or empty JSON payload']);
    exit;
}

@mkdir(dirname($contentFile), 0777, true);

$jsonString = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$saved = file_put_contents($contentFile, $jsonString);
@file_put_contents($bridgeFile, $jsonString);

// Sync live notice if present
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
    @file_put_contents($bridgeNotices, json_encode($noticeObj, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
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

echo json_encode(['ok' => true, 'message' => 'All changes saved to server successfully!']);
