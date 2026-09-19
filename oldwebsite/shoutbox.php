<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dataFile = __DIR__ . '/../assets/data/chat_messages.json';
$bridgeFile = __DIR__ . '/../bridge_a73c9_messages.php';

// If GET, return messages
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        echo file_get_contents($dataFile);
    } elseif (file_exists($bridgeFile)) {
        echo file_get_contents($bridgeFile);
    } else {
        echo json_encode([]);
    }
    exit;
}

// If POST, handle new chat message
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$shout = isset($_POST['shout']) ? trim($_POST['shout']) : '';
$date = isset($_POST['date']) ? trim($_POST['date']) : date('Y-m-d H:i:s');

if (empty($name)) {
    $name = 'Guest';
}

if (empty($shout)) {
    echo json_encode(['ok' => false, 'error' => 'Message cannot be empty']);
    exit;
}

$messages = [];
if (file_exists($dataFile)) {
    $raw = @file_get_contents($dataFile);
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $messages = $decoded;
    }
}

$newId = count($messages) + 1;
$newMsg = [
    'id' => $newId,
    'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
    'shout' => htmlspecialchars($shout, ENT_QUOTES, 'UTF-8'),
    'date' => $date
];

$messages[] = $newMsg;
if (count($messages) > 60) {
    $messages = array_slice($messages, -60);
}

@file_put_contents($dataFile, json_encode($messages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
@file_put_contents($bridgeFile, json_encode($messages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(['ok' => true, 'message' => $newMsg]);
