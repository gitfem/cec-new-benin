<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/assets/data/attendance.json';
$records = [];

if (file_exists($dataFile)) {
    $content = file_get_contents($dataFile);
    $records = json_decode($content, true) ?: [];
}

// Handle GET - Return records
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode($records);
    exit;
}

// Handle POST - Record attendance
$input = $_POST;
if (empty($input)) {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: [];
}

$fullname = trim($input['fullname'] ?? $input['name'] ?? 'Guest');
$group = trim($input['group'] ?? 'General');
$phone = trim($input['phone'] ?? '');
$email = trim($input['email'] ?? '');
$category = trim($input['category'] ?? 'Church Member');
$viewing_mode = trim($input['viewing_mode'] ?? $input['viewingMode'] ?? 'individual');
$count = max(1, intval($input['attendance'] ?? $input['count'] ?? 1));
$service_name = trim($input['service_name'] ?? 'Sunday Service of Excellence');
$platform = trim($input['platform'] ?? 'Web App');
$notes = trim($input['notes'] ?? '');

$now = new DateTime('now', new DateTimeZone('Africa/Lagos'));
$dateStr = $now->format('Y-m-d');
$timeStr = $now->format('h:i A');
$timestampStr = $now->format('M d, Y - h:i A');
$id = 'ATT-' . $now->format('YmdHis') . '-' . rand(100, 999);

$record = [
    'id' => $id,
    'name' => $fullname,
    'category' => $category,
    'group' => $group,
    'phone' => $phone,
    'email' => $email,
    'viewing_mode' => $viewing_mode,
    'count' => $count,
    'service_name' => $service_name,
    'date' => $dateStr,
    'time' => $timeStr,
    'timestamp' => $timestampStr,
    'platform' => $platform,
    'notes' => $notes
];

// Append and keep last 500 records
$records[] = $record;
if (count($records) > 500) {
    $records = array_slice($records, -500);
}

// Save back to attendance.json
file_put_contents($dataFile, json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'ok' => true,
    'record' => $record,
    'member' => [
        'name' => $fullname,
        'group' => $group,
        'category' => $category
    ]
]);