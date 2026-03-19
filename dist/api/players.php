<?php
header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $pdo->exec("CREATE TABLE IF NOT EXISTS known_players (
        id         VARCHAR(36)  PRIMARY KEY,
        name       VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB error']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: list all known players ───────────────────────────────────────────────
if ($method === 'GET') {
    echo json_encode(
        $pdo->query("SELECT id, name FROM known_players ORDER BY name")
            ->fetchAll(PDO::FETCH_ASSOC)
    );

// ── POST: add a player ────────────────────────────────────────────────────────
} elseif ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);
    $pdo->prepare("INSERT IGNORE INTO known_players (id, name) VALUES (?, ?)")
        ->execute([$b['id'], $b['name']]);
    echo json_encode(['ok' => true]);

// ── DELETE: remove a player ───────────────────────────────────────────────────
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    $pdo->prepare("DELETE FROM known_players WHERE id = ?")->execute([$id]);
    echo json_encode(['ok' => true]);

// ── PUT: rename a player ──────────────────────────────────────────────────────
} elseif ($method === 'PUT') {
    $b = json_decode(file_get_contents('php://input'), true);
    $pdo->prepare("UPDATE known_players SET name = ? WHERE id = ?")
        ->execute([$b['name'], $b['id']]);
    echo json_encode(['ok' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
