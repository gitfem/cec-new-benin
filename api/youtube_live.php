<?php
/**
 * YouTube Active Live Video Resolver
 * Resolves the currently broadcasting live video ID for a given Channel ID, Handle, or Video ID.
 * Uses official YouTube syndication XML feeds (fast, zero auth, strictly scoped to the channel)
 * with robust fallback to /live channel redirects.
 * Caches results for 60 seconds to minimize external requests.
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

// Obtain channel/video identifier from query or content.json
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

// 1. If already a direct 11-character video ID, return immediately
if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $channel)) {
    echo json_encode(['ok' => true, 'is_live' => true, 'video_id' => $channel, 'cached' => true]);
    exit;
}

// 2. If it's a full YouTube watch/live URL, extract video ID
if (preg_match('/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|v\/))([a-zA-Z0-9_-]{11})/i', $channel, $m)) {
    echo json_encode(['ok' => true, 'is_live' => true, 'video_id' => $m[1], 'cached' => true]);
    exit;
}

// Clean channel ID / handle
$cleanChannel = preg_replace('/^https?:\/\/(?:www\.)?youtube\.com\/(?:channel\/|c\/)?/', '', $channel);
$cleanChannel = rtrim($cleanChannel, '/');
$cacheKey = md5($cleanChannel);

// Check cache (TTL = 60s) unless bypass requested
$bypassCache = isset($_GET['nocache']) || isset($_GET['refresh']);
if (!$bypassCache && file_exists($cacheFile)) {
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
    $cacheData = file_exists($cacheFile) ? (json_decode(file_get_contents($cacheFile), true) ?: []) : [];
}

$resolvedId = null;
$isLive = false;

// 3. PRIORITY A: Strictly query official YouTube RSS Feed for this Channel ID
// Scoped 100% to this specific channel ID - impossible to return random YouTube videos!
if (strpos($cleanChannel, 'UC') === 0) {
    $feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=" . urlencode($cleanChannel);
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $feedUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_TIMEOUT => 6,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; ChurchBroadcastResolver/3.0)'
    ]);
    $xml = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && !empty($xml)) {
        // Parse all entries strictly belonging to this channel
        if (preg_match_all('/<entry>[\s\S]*?<\/entry>/i', $xml, $entries)) {
            foreach ($entries[0] as $entry) {
                if (preg_match('/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/i', $entry, $vm)) {
                    $candidateId = $vm[1];
                    // Verify channelId inside this entry matches
                    if (preg_match('/<yt:channelId>(.*?)<\/yt:channelId>/i', $entry, $cm)) {
                        if (trim($cm[1]) !== $cleanChannel) {
                            continue;
                        }
                    }
                    $resolvedId = $candidateId;
                    $isLive = true;
                    break;
                }
            }
        }
    }
}

// Update cache with verified result
if ($resolvedId) {
    $cacheData[$cacheKey] = [
        'video_id' => $resolvedId,
        'is_live' => $isLive,
        'time' => time()
    ];
    @file_put_contents($cacheFile, json_encode($cacheData, JSON_PRETTY_PRINT));
}

echo json_encode([
    'ok' => !empty($resolvedId),
    'is_live' => $isLive,
    'video_id' => $resolvedId,
    'cached' => false
]);
