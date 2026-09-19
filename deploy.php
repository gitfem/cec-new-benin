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
