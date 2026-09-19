<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Increase memory & execution time for large video/audio uploads
@ini_set('upload_max_filesize', '500M');
@ini_set('post_max_size', '500M');
@ini_set('memory_limit', '512M');
@ini_set('max_execution_time', '300');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$dir = dirname(__DIR__) . '/assets/uploaded_media';
@mkdir($dir, 0777, true);

// 1. Multipart Form Upload (Ideal for Video & Audio Files)
if (!empty($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
    $origName = !empty($_POST['filename']) ? $_POST['filename'] : $_FILES['file']['name'];
    $cleanName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $origName);
    $cleanName = time() . '_' . $cleanName;
    $targetPath = $dir . '/' . $cleanName;
    
    if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
        echo json_encode([
            'ok' => true,
            'url' => 'assets/uploaded_media/' . $cleanName
        ]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Failed to move uploaded file']);
        exit;
    }
}

// 2. JSON Payload (Base64 data)
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if ($data && !empty($data['data'])) {
    $filename = isset($data['filename']) ? $data['filename'] : 'upload_' . time() . '.bin';
    $cleanName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $filename);
    $cleanName = time() . '_' . $cleanName;

    $b64 = $data['data'];
    if (strpos($b64, ',') !== false) {
        list(, $b64) = explode(',', $b64);
    }

    $fileBytes = base64_decode($b64);
    if ($fileBytes !== false) {
        $targetPath = $dir . '/' . $cleanName;
        file_put_contents($targetPath, $fileBytes);
        echo json_encode([
            'ok' => true,
            'url' => 'assets/uploaded_media/' . $cleanName
        ]);
        exit;
    }
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'No valid media data provided']);
