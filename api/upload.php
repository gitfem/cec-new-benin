<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || empty($data['data'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'No image data provided']);
    exit;
}

$filename = isset($data['filename']) ? $data['filename'] : 'upload_' . time() . '.jpg';
$cleanName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $filename);
$cleanName = time() . '_' . $cleanName;

$b64 = $data['data'];
if (strpos($b64, ',') !== false) {
    list(, $b64) = explode(',', $b64);
}

$fileBytes = base64_decode($b64);
if ($fileBytes === false) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid base64']);
    exit;
}

$dir = dirname(__DIR__) . '/assets/uploaded_media';
@mkdir($dir, 0777, true);

$targetPath = $dir . '/' . $cleanName;
file_put_contents($targetPath, $fileBytes);

echo json_encode([
    'ok' => true,
    'url' => 'assets/uploaded_media/' . $cleanName
]);
