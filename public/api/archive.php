<?php
header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $pdo->exec("CREATE TABLE IF NOT EXISTS game_sessions (
        id           VARCHAR(36)    PRIMARY KEY,
        date_label   VARCHAR(100)   NOT NULL,
        buy_in       DECIMAL(10,2)  NOT NULL,
        initial_chips INT           NOT NULL,
        pot          DECIMAL(10,2)  NOT NULL,
        chip_value   DECIMAL(10,6)  NOT NULL,
        notes        TEXT,
        created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS session_players (
        id           VARCHAR(36)  PRIMARY KEY,
        session_id   VARCHAR(36)  NOT NULL,
        name         VARCHAR(100) NOT NULL,
        has_bought_in TINYINT(1)  DEFAULT 0,
        rebuys       INT          DEFAULT 0,
        final_chips  INT          DEFAULT 0,
        sort_order   INT          DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB error: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: return all sessions with players ─────────────────────────────────────
if ($method === 'GET') {
    $sessions = $pdo->query(
        "SELECT * FROM game_sessions ORDER BY created_at DESC"
    )->fetchAll(PDO::FETCH_ASSOC);

    foreach ($sessions as &$s) {
        $stmt = $pdo->prepare(
            "SELECT * FROM session_players WHERE session_id = ? ORDER BY sort_order"
        );
        $stmt->execute([$s['id']]);
        $s['players'] = array_map(fn($p) => [
            'id'          => $p['id'],
            'name'        => $p['name'],
            'hasBoughtIn' => (bool)$p['has_bought_in'],
            'rebuys'      => (int)$p['rebuys'],
            'finalChips'  => (int)$p['final_chips'],
        ], $stmt->fetchAll(PDO::FETCH_ASSOC));

        // Rename DB columns to match JS camelCase
        $s['buyIn']        = (float)$s['buy_in'];
        $s['initialChips'] = (int)$s['initial_chips'];
        $s['pot']          = (float)$s['pot'];
        $s['chipValue']    = (float)$s['chip_value'];
        $s['date']         = $s['date_label'];
        unset($s['buy_in'], $s['initial_chips'], $s['chip_value'], $s['date_label'], $s['created_at']);
    }
    echo json_encode(array_values($sessions));

// ── POST: save a new session ──────────────────────────────────────────────────
} elseif ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);
    if (!$b || !isset($b['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data']);
        exit;
    }

    $pdo->prepare(
        "INSERT INTO game_sessions
            (id, date_label, buy_in, initial_chips, pot, chip_value, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )->execute([
        $b['id'], $b['date'], $b['buyIn'], $b['initialChips'],
        $b['pot'], $b['chipValue'], $b['notes'] ?? null,
    ]);

    foreach (($b['players'] ?? []) as $i => $p) {
        $pdo->prepare(
            "INSERT INTO session_players
                (id, session_id, name, has_bought_in, rebuys, final_chips, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )->execute([
            $p['id'], $b['id'], $p['name'],
            $p['hasBoughtIn'] ? 1 : 0,
            $p['rebuys'], $p['finalChips'], $i,
        ]);
    }
    echo json_encode(['ok' => true]);

// ── DELETE: remove a session ──────────────────────────────────────────────────
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    // session_players cascade-deletes via FK
    $pdo->prepare("DELETE FROM game_sessions WHERE id = ?")->execute([$id]);
    echo json_encode(['ok' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
