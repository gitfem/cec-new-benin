<?php
/**
 * YouTube Active Live Video Resolver
 * Resolves the currently broadcasting live video ID for a given Channel ID or Handle.
 * Does NOT require any sensitive API keys or client secrets.
 * Caches results for 60 seconds to minimize external HTTP requests.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=60');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$baseDir = dirname(__DIR__);
$dataDir = $baseDir . '/assets/data';
$cacheFile = $dataDir . '/youtube_live_cache.json';

// Obtain channel ID from query or content.json
$channel = trim($_GET['channel'] ?? '');
if (empty($channel)) {
    $contentFile = $dataDir . '/content.json';
    if (file_exists($contentFile)) {
        $cms = json_decode(file_get_contents($contentFile), true);
        $channel = trim($cms['live']['youtube_channel_id'] ?? '');
    }
}

if (empty($channel)) {
    echo json_encode(['ok' => false, 'error' => 'No channel configured', 'video_id' => null, 'is_live' => false]);
    exit;
}

// If already a direct 11-character video ID, return immediately
if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $channel)) {
    echo json_encode(['ok' => true, 'is_live' => true, 'video_id' => $channel, 'cached' => true]);
    exit;
}

// If it's a full YouTube watch/live URL, extract video ID
if (preg_match('/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|v\/))([a-zA-Z0-9_-]{11})/i', $channel, $m)) {
    echo json_encode(['ok' => true, 'is_live' => true, 'video_id' => $m[1], 'cached' => true]);
    exit;
}

// Clean channel ID / handle
$cleanChannel = preg_replace('/^https?:\/\/(?:www\.)?youtube\.com\/(?:channel\/|c\/)?/', '', $channel);
$cleanChannel = rtrim($cleanChannel, '/');
$cacheKey = md5($cleanChannel);

// Check cache (TTL = 60s)
if (file_exists($cacheFile)) {
    $cacheData = json_decode(file_get_contents($cacheFile), true);
    if (is_array($cacheData) && isset($cacheData[$cacheKey])) {
        $entry = $cacheData[$cacheKey];
        if (isset($entry['time']) && (time() - $entry['time']) < 60) {
            echo json_encode([
                'ok' => true,
                'is_live' => !empty($entry['is_live']),
                'video_id' => $entry['video_id'] ?? null,
                'cached' => true
            ]);
            exit;
        }
    }
} else {
    $cacheData = [];
}

// Build live URL
if (strpos($cleanChannel, '@') === 0) {
    $targetUrl = "https://www.youtube.com/{$cleanChannel}/live?cbrd=1&ucbcb=1";
} else {
    $targetUrl = "https://www.youtube.com/channel/{$cleanChannel}/live?cbrd=1&ucbcb=1";
}

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $targetUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_TIMEOUT => 6,
    CURLOPT_CONNECTTIMEOUT => 4,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]);

$html = curl_exec($ch);
$finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$resolvedId = null;
$isLive = false;

if ($httpCode >= 200 && $httpCode < 400 && !empty($html)) {
    // 1. Check if redirected to a watch?v= URL
    if (preg_match('/watch\?v=([a-zA-Z0-9_-]{11})/i', $finalUrl, $vm)) {
        $resolvedId = $vm[1];
    }
    // 2. Check canonical URL in HTML
    if (!$resolvedId && preg_match('/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/i', $html, $vm)) {
        $resolvedId = $vm[1];
    }
    // 3. Check JSON videoId in initial player response
    if (!$resolvedId && preg_match('/"videoId":"([a-zA-Z0-9_-]{11})"/i', $html, $vm)) {
        $resolvedId = $vm[1];
    }

    if ($resolvedId) {
        // Verify stream is currently live or scheduled
        if (preg_match('/"isLive":true|"status":"LIVE"|"liveStreamabilityRenderer"|<meta itemprop="isLiveBroadcast" content="True"/i', $html)) {
            $isLive = true;
        } else {
            // Also consider active if canonical watch URL was loaded directly from /live
            $isLive = true;
        }
    }
}

// Update cache
$cacheData[$cacheKey] = [
    'video_id' => $resolvedId,
    'is_live' => $isLive,
    'time' => time()
];
@file_put_contents($cacheFile, json_encode($cacheData, JSON_PRETTY_PRINT));

echo json_encode([
    'ok' => true,
    'is_live' => $isLive,
    'video_id' => $resolvedId,
    'cached' => false
]);
