<?php
// Coral Bank (fictional) - demo contact handler.
// Run from the project root:  php -S 127.0.0.1:8000
// Messages are saved to ../data/messages.jsonl (demo only).

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST only']);
    exit;
}

$name    = trim(substr($_POST['name'] ?? '', 0, 80));
$email   = trim(substr($_POST['email'] ?? '', 0, 120));
$message = trim(substr($_POST['message'] ?? '', 0, 2000));

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($message) < 5) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid input']);
    exit;
}

$dir = __DIR__ . '/../data';
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}

$line = json_encode([
    'at'      => gmdate('c'),
    'name'    => $name,
    'email'   => $email,
    'message' => $message,
], JSON_UNESCAPED_UNICODE) . PHP_EOL;

file_put_contents($dir . '/messages.jsonl', $line, FILE_APPEND | LOCK_EX);

echo json_encode(['ok' => true]);
