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

function cec_validate_phone($phone, $required = true) {
    $p = trim($phone ?? '');
    if ($p === '') {
        return $required ? [false, 'Please enter your phone number.'] : [true, ''];
    }
    $cleaned = preg_replace('/[\s\-\(\)\.]/', '', $p);
    if (!preg_match('/^\+?[0-9]{8,15}$/', $cleaned)) {
        return [false, 'Phone number must be between 8 and 15 digits (local or international format).'];
    }
    $digitsOnly = ltrim($cleaned, '+');
    if (preg_match('/^(\d)\1+$/', $digitsOnly)) {
        return [false, 'Please enter an active phone number, not repeated digits.'];
    }
    $dummySequences = ['12345678', '87654321', '01234567', '76543210', '98765432'];
    foreach ($dummySequences as $seq) {
        if (strpos($digitsOnly, $seq) !== false) {
            return [false, 'Please enter an active phone number, not a sequential test number.'];
        }
    }
    $distinct = count(count_chars($digitsOnly, 1));
    if ($distinct < 3) {
        return [false, 'Please enter a genuine active phone number.'];
    }
    if (strpos($cleaned, '0') === 0) {
        if (strlen($cleaned) !== 11) {
            return [false, 'Local Nigerian phone numbers must be 11 digits (e.g. 08023456789).'];
        }
        if (!preg_match('/^0(?:[789][01]\d{8}|[1-9]\d{7,8})$/', $cleaned)) {
            return [false, 'Please enter a valid Nigerian phone number prefix (e.g. 080, 081, 070, 090, 091).'];
        }
        $sub = substr($cleaned, 3);
        if (preg_match('/^(\d)\1+$/', $sub)) {
            return [false, 'Please enter an active phone number.'];
        }
        return [true, $cleaned];
    }
    if (strpos($cleaned, '+234') === 0 || strpos($cleaned, '234') === 0) {
        $norm = (strpos($cleaned, '+234') === 0) ? substr($cleaned, 4) : substr($cleaned, 3);
        if (strpos($norm, '0') === 0) {
            $norm = substr($norm, 1);
        }
        if (strlen($norm) !== 10) {
            return [false, 'Nigerian international numbers must have 10 digits after +234.'];
        }
        if (!preg_match('/^[789][01]\d{8}$|^[1-9]\d{7,8}$/', $norm)) {
            return [false, 'Invalid Nigerian phone number format after +234.'];
        }
        if (preg_match('/^(\d)\1+$/', substr($norm, 2))) {
            return [false, 'Please enter an active phone number.'];
        }
        return [true, '+234' . $norm];
    }
    if (strlen($digitsOnly) < 8 || strlen($digitsOnly) > 15) {
        return [false, 'International phone numbers must be between 8 and 15 digits.'];
    }
    return [true, $cleaned];
}

function cec_validate_email($email, $required = false) {
    $e = strtolower(trim($email ?? ''));
    if ($e === '') {
        return $required ? [false, 'Please enter your email address.'] : [true, ''];
    }
    $placeholders = ['name@email.com', 'you@example.com', 'johndoe@gmail.com', 'email@email.com'];
    if (in_array($e, $placeholders, true)) {
        return [false, 'Please enter your actual email address, not placeholder text.'];
    }
    if (!filter_var($e, FILTER_VALIDATE_EMAIL)) {
        return [false, 'Please enter a valid email address (e.g. name@domain.com).'];
    }
    $parts = explode('@', $e, 2);
    if (count($parts) !== 2) {
        return [false, 'Please enter a valid email address.'];
    }
    $user = $parts[0];
    $domain = $parts[1];
    $domainParts = explode('.', $domain);
    $tld = end($domainParts);
    if (strlen($tld) < 2 || !preg_match('/^[a-z]+$/', $tld)) {
        return [false, 'Please enter an email with a valid domain extension.'];
    }
    $dummyUsers = ['test', 'testing', 'fake', 'none', 'noemail', 'dummy', 'asdf', 'sample', 'random', 'fakemail'];
    if (in_array($user, $dummyUsers, true)) {
        return [false, "\"{$user}\" is not a valid email username. Please use your real email."];
    }
    if (strlen($user) >= 4 && preg_match('/^([a-z0-9])\1+$/', $user)) {
        return [false, 'Please enter an active email address.'];
    }
    $fakeDomains = [
        'test.com', 'fake.com', 'none.com', 'domain.com', 'sample.com', 'noemail.com',
        'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com',
        'throwawaymail.com', 'sharklasers.com', 'yopmail.com', 'trashmail.com',
        'example.com', 'example.org', 'xyz.com', 'abc.com'
    ];
    if (in_array($domain, $fakeDomains, true)) {
        return [false, "\"{$domain}\" is not an active email provider. Please use your active email (e.g. @gmail.com, @yahoo.com)."];
    }
    return [true, $e];
}

$fullname = trim($input['fullname'] ?? $input['name'] ?? 'Guest');
$group = trim($input['group'] ?? 'General');
$phoneRaw = trim($input['phone'] ?? '');
$emailRaw = trim($input['email'] ?? '');

$phoneVal = cec_validate_phone($phoneRaw, true);
if (!$phoneVal[0]) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $phoneVal[1]]);
    exit;
}
$phone = $phoneVal[1];

$emailVal = cec_validate_email($emailRaw, false);
if (!$emailVal[0]) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $emailVal[1]]);
    exit;
}
$email = $emailVal[1];

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