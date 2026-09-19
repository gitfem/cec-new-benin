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

$dataFile = __DIR__ . '/assets/data/chat_messages.json';

// Handle POST: Add new chat message
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = $_POST;
    if (empty($input)) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: [];
    }

    $name = trim($input['name'] ?? 'Guest');
    $shout = trim($input['shout'] ?? $input['message'] ?? $input['text'] ?? '');
    $dateStr = $input['date'] ?? date('jS M, Y H:i');

    if (empty($shout)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Message text is required']);
        exit;
    }

    $chats = [];
    if (file_exists($dataFile)) {
        $raw = @file_get_contents($dataFile);
        $chats = json_decode($raw, true) ?: [];
    }

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

    file_put_contents($dataFile, json_encode($chats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['ok' => true, 'message' => $newMsg]);
    exit;
}

// Handle GET: Return messages in chronological order
if (file_exists($dataFile)) {
    echo file_get_contents($dataFile);
} else {
    echo '[]';
}
exit;