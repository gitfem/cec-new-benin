<?php
/**
 * Christ Embassy New Benin - GitHub Automated Deployment Webhook & Sync Endpoint
 * 
 * Usage:
 *  - Automated: Add as Webhook in GitHub repo: https://christembassynewbenin.org/deploy.php?secret=cec_benin_deploy_2026
 *  - Manual: Trigger via GET or POST with ?secret=cec_benin_deploy_2026
 */

header('Content-Type: application/json; charset=utf-8');

$SECRET_KEY = 'cec_benin_deploy_2026';

// Verify secret
$providedSecret = $_GET['secret'] ?? $_POST['secret'] ?? '';
$headers = getallheaders();
$hubSignature = $headers['X-Hub-Signature-256'] ?? '';

if ($providedSecret !== $SECRET_KEY) {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => 'Invalid or missing deployment secret.'
    ]);
    exit;
}

$repoDir = __DIR__;
chdir($repoDir);

// Preserve runtime CMS data files before reset
$contentFile = $repoDir . '/assets/data/content.json';
$contentBackup = file_exists($contentFile) ? file_get_contents($contentFile) : null;
$dbFile = $repoDir . '/assets/data/church.db';
$dbBackup = file_exists($dbFile) ? file_get_contents($dbFile) : null;
$attFile = $repoDir . '/assets/data/attendance.json';
$attBackup = file_exists($attFile) ? file_get_contents($attFile) : null;
$chatFile = $repoDir . '/assets/data/chat_messages.json';
$chatBackup = file_exists($chatFile) ? file_get_contents($chatFile) : null;

// Execute git fetch and reset to match origin main
$commands = [
    'git config user.name "CEC Benin Deployment"',
    'git config user.email "admin@christembassynewbenin.org"',
    'git fetch origin main 2>&1',
    'git reset --hard origin/main 2>&1',
    'git log -n 1 --oneline 2>&1'
];

$output = [];
$returnVar = 0;

foreach ($commands as $cmd) {
    $cmdOutput = [];
    exec($cmd, $cmdOutput, $returnCode);
    $output[$cmd] = implode("\n", $cmdOutput);
    if ($returnCode !== 0 && strpos($cmd, 'git reset') !== false) {
        $returnVar = $returnCode;
    }
}

// Restore active runtime data if backup had custom content
if ($contentBackup) {
    $existing = json_decode($contentBackup, true);
    if ($existing && !empty($existing['site']['address']) && strpos($existing['site']['address'], 'To Be Supplied') === false) {
        file_put_contents($contentFile, $contentBackup);
    }
}
if ($dbBackup && (!file_exists($dbFile) || filesize($dbFile) === 0)) {
    file_put_contents($dbFile, $dbBackup);
}
if ($attBackup) {
    file_put_contents($attFile, $attBackup);
}
if ($chatBackup) {
    file_put_contents($chatFile, $chatBackup);
}

// Preserve/ensure permissions for dynamic data dirs
@chmod($repoDir . '/assets/data', 0777);
@chmod($repoDir . '/assets/uploaded_media', 0777);

$success = ($returnVar === 0);
if (!$success) {
    http_response_code(500);
}

echo json_encode([
    'ok' => $success,
    'timestamp' => date('Y-m-d H:i:s'),
    'message' => $success ? 'Successfully deployed from GitHub!' : 'Deployment encountered issues.',
    'details' => $output
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
