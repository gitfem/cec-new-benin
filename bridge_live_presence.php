<?php
/**
 * CEC New Benin - Real-Time Live Presence & Active Viewer Tracker
 * Tracks authentic active viewers based on client heartbeats (15-20s interval).
 * Automatically prunes stale sessions after 40 seconds of inactivity.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/assets/data/live_presence.json';
$timeoutSeconds = 40; // Expire inactive sessions after 40 seconds
$now = time();

// Load existing active sessions
$sessions = [];
if (file_exists($dataFile)) {
    $content = @file_get_contents($dataFile);
    if (!empty($content)) {
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $sessions = $decoded;
        }
    }
}

// Prune any sessions older than $timeoutSeconds
$activeSessions = [];
foreach ($sessions as $tok => $info) {
    $lastSeen = intval($info['last_seen'] ?? 0);
    if (($now - $lastSeen) < $timeoutSeconds) {
        $activeSessions[$tok] = $info;
    }
}
$sessions = $activeSessions;

// Process incoming request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = $_POST;
    if (empty($input)) {
        $raw = @file_get_contents('php://input');
        if (!empty($raw)) {
            $input = json_decode($raw, true) ?: [];
        }
    }

    $token = trim($input['token'] ?? '');
    $action = trim($input['action'] ?? 'heartbeat');
    $name = trim($input['name'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $attendance = max(1, intval($input['attendance'] ?? 1));

    // If client provided a token, track or remove
    if (!empty($token)) {
        if ($action === 'leave') {
            unset($sessions[$token]);
        } else {
            // Heartbeat
            $sessions[$token] = [
                'token' => $token,
                'name' => $name,
                'phone' => $phone,
                'attendance' => $attendance,
                'last_seen' => $now,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
            ];
        }
    }

    // Save updated active sessions with file lock
    @file_put_contents($dataFile, json_encode($sessions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// Calculate true viewer count
$totalViewers = 0;
foreach ($sessions as $tok => $info) {
    $totalViewers += intval($info['attendance'] ?? 1);
}

echo json_encode([
    'ok' => true,
    'total' => $totalViewers,
    'active_sessions' => count($sessions)
]);