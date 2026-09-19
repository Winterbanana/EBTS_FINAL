<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

const DB_HOST = '127.0.0.1';
const DB_NAME = 'wcc_equipment_system';
const DB_USER = 'root';
const DB_PASS = '';

function respond(array $payload, int $status = 200): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function database(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
    $server = new PDO('mysql:host=' . DB_HOST . ';charset=utf8mb4', DB_USER, DB_PASS, $options);
    $server->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, $options);
    return $pdo;
}

function ensureSchema(PDO $db): void {
    $db->exec("CREATE TABLE IF NOT EXISTS wcc_users (
        id VARCHAR(50) NOT NULL PRIMARY KEY, password VARCHAR(255) NOT NULL,
        role ENUM('student','admin','staff') NOT NULL, name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NULL, course VARCHAR(50) NULL, section VARCHAR(20) NULL,
        contact VARCHAR(30) NULL, can_borrow TINYINT(1) DEFAULT 1,
        missing_item_debt DECIMAL(10,2) DEFAULT 0, metadata_json LONGTEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS wcc_equipment (
        id VARCHAR(20) NOT NULL PRIMARY KEY, name VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL, qrcode VARCHAR(100) NOT NULL,
        total_stock INT DEFAULT 1, available_stock INT DEFAULT 1, borrowed_stock INT DEFAULT 0,
        status ENUM('Available','Borrowed','Missing') DEFAULT 'Available', borrowed_by VARCHAR(200) NULL,
        borrow_date DATE NULL, due_date DATE NULL, quality_condition VARCHAR(20) DEFAULT 'Excellent',
        last_condition_update DATE NULL, condition_notes TEXT NULL, last_borrowed_by VARCHAR(200) NULL,
        metadata_json LONGTEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS wcc_transactions (
        id VARCHAR(20) NOT NULL PRIMARY KEY, student_id VARCHAR(50) NOT NULL, student_name VARCHAR(150) NOT NULL,
        student_course VARCHAR(50) NULL, student_contact VARCHAR(30) NULL, equipment_id VARCHAR(20) NOT NULL,
        equipment_name VARCHAR(100) NOT NULL, equipment_qrcode VARCHAR(100) NULL, request_date DATE NULL,
        due_date DATE NULL, borrow_time VARCHAR(10) NULL, due_time VARCHAR(10) NULL, return_date DATE NULL,
        return_time VARCHAR(10) NULL, status VARCHAR(20) DEFAULT 'Pending', approved_by VARCHAR(100) NULL,
        approved_date DATE NULL, condition_before VARCHAR(20) NULL, condition_after VARCHAR(20) NULL,
        condition_notes TEXT NULL, metadata_json LONGTEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS wcc_transaction_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY, transaction_id VARCHAR(20) NOT NULL,
        event VARCHAR(100) NOT NULL, actor VARCHAR(150) NOT NULL, event_date DATE NULL,
        detail TEXT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS wcc_penalty_records (
        id INT AUTO_INCREMENT PRIMARY KEY, transaction_id VARCHAR(20) NOT NULL,
        student_id VARCHAR(50) NOT NULL, student_name VARCHAR(150) NOT NULL,
        equipment_name VARCHAR(100) NOT NULL, penalty_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0, overdue_hours INT DEFAULT 0,
        penalty_paid TINYINT(1) DEFAULT 0, payment_method VARCHAR(50) NULL,
        payment_date DATE NULL, return_date DATE NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS wcc_app_state (
        id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
        state_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    foreach ([
        'wcc_users' => 'metadata_json LONGTEXT NULL',
        'wcc_equipment' => 'metadata_json LONGTEXT NULL',
        'wcc_transactions' => 'metadata_json LONGTEXT NULL'
    ] as $table => $column) {
        try { $db->exec("ALTER TABLE `$table` ADD COLUMN $column"); } catch (Throwable $ignored) {}
    }
}

function textValue(array $row, string $key): ?string {
    return isset($row[$key]) && $row[$key] !== '' ? (string)$row[$key] : null;
}

function numberValue(array $row, string $key, int $default = 0): int {
    return isset($row[$key]) ? (int)$row[$key] : $default;
}

try {
    $db = database();
    ensureSchema($db);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $row = $db->query('SELECT state_json FROM wcc_app_state WHERE id = 1')->fetch();
        if (!$row) respond(['configured' => false, 'data' => null]);
        $state = json_decode($row['state_json'], true);
        $configured = is_array($state)
            && !empty($state['users'])
            && !empty($state['equipment']);
        respond(['configured' => $configured, 'data' => $configured ? $state : null]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method not allowed'], 405);
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body) || !isset($body['users'], $body['equipment'], $body['requests'])) {
        respond(['error' => 'Invalid application state payload'], 400);
    }

    $stateJson = json_encode([
        'users' => array_values($body['users']),
        'equipment' => array_values($body['equipment']),
        'requests' => array_values($body['requests'])
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($stateJson === false) respond(['error' => 'State could not be encoded'], 400);

    $db->beginTransaction();
    $saveState = $db->prepare('INSERT INTO wcc_app_state (id, state_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)');
    $saveState->execute([$stateJson]);

    foreach (['wcc_users', 'wcc_equipment', 'wcc_transactions', 'wcc_transaction_logs', 'wcc_penalty_records'] as $table) {
        try { $db->exec("DELETE FROM `$table`"); } catch (Throwable $ignored) {}
    }

    $userSql = 'INSERT INTO wcc_users (id,password,role,name,email,course,section,contact,can_borrow,missing_item_debt,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
    $userStmt = $db->prepare($userSql);
    foreach ($body['users'] as $user) {
        if (!is_array($user) || !isset($user['id'])) continue;
        $userStmt->execute([
            (string)$user['id'], (string)($user['password'] ?? ''), (string)($user['role'] ?? 'student'),
            (string)($user['name'] ?? ''), textValue($user, 'email'), textValue($user, 'course'), textValue($user, 'section'),
            textValue($user, 'contact'), ($user['canBorrow'] ?? true) === false ? 0 : 1, (float)($user['missingItemDebt'] ?? 0), json_encode($user)
        ]);
    }

    $equipmentSql = 'INSERT INTO wcc_equipment (id,name,category,qrcode,total_stock,available_stock,borrowed_stock,status,borrowed_by,borrow_date,due_date,quality_condition,last_condition_update,condition_notes,last_borrowed_by,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    $equipmentStmt = $db->prepare($equipmentSql);
    foreach ($body['equipment'] as $item) {
        if (!is_array($item) || !isset($item['id'])) continue;
        $equipmentStmt->execute([
            (string)$item['id'], (string)($item['name'] ?? ''), (string)($item['category'] ?? 'Wires'), (string)($item['qrcode'] ?? ''),
            numberValue($item, 'totalStock', 1), numberValue($item, 'availableStock', 1), numberValue($item, 'borrowedStock'),
            (string)($item['status'] ?? 'Available'), textValue($item, 'borrowedBy'), textValue($item, 'borrowDate'), textValue($item, 'dueDate'),
            (string)($item['qualityCondition'] ?? 'Excellent'), textValue($item, 'lastConditionUpdate'), textValue($item, 'conditionNotes'), textValue($item, 'lastBorrowedBy'), json_encode($item)
        ]);
    }

    $transactionSql = 'INSERT INTO wcc_transactions (id,student_id,student_name,student_course,student_contact,equipment_id,equipment_name,equipment_qrcode,request_date,due_date,borrow_time,due_time,return_date,return_time,status,approved_by,approved_date,condition_before,condition_after,condition_notes,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    $transactionStmt = $db->prepare($transactionSql);
    foreach ($body['requests'] as $request) {
        if (!is_array($request) || !isset($request['id'])) continue;
        $transactionStmt->execute([
            (string)$request['id'], (string)($request['studentId'] ?? ''), (string)($request['studentName'] ?? ''), textValue($request, 'studentCourse'), textValue($request, 'studentContact'),
            (string)($request['equipmentId'] ?? ''), (string)($request['equipmentName'] ?? ''), textValue($request, 'equipmentQRCode'), textValue($request, 'requestDate'), textValue($request, 'dueDate'),
            textValue($request, 'borrowTime'), textValue($request, 'dueTime'), textValue($request, 'returnDate'), textValue($request, 'returnTime'), (string)($request['status'] ?? 'Pending'),
            textValue($request, 'approvedBy'), textValue($request, 'approvedDate'), textValue($request, 'conditionBefore'), textValue($request, 'conditionAfter'), textValue($request, 'conditionNotes'), json_encode($request)
        ]);
    }

    $logStmt = $db->prepare('INSERT INTO wcc_transaction_logs (transaction_id,event,actor,event_date,detail) VALUES (?,?,?,?,?)');
    $penaltyStmt = $db->prepare('INSERT INTO wcc_penalty_records (transaction_id,student_id,student_name,equipment_name,penalty_type,amount,overdue_hours,penalty_paid,payment_method,payment_date,return_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    foreach ($body['requests'] as $request) {
        if (!is_array($request) || !isset($request['id'])) continue;
        $id = (string)$request['id'];
        if (isset($request['requestDate'])) $logStmt->execute([$id, 'Request Submitted', (string)($request['studentName'] ?? ''), textValue($request, 'requestDate'), 'Equipment: ' . (string)($request['equipmentName'] ?? '')]);
        if (($request['status'] ?? '') === 'Approved' && isset($request['approvedDate'])) $logStmt->execute([$id, 'Request Approved', (string)($request['approvedBy'] ?? 'Admin'), textValue($request, 'approvedDate'), 'Approved for ' . (string)($request['studentName'] ?? '')]);
        if (($request['status'] ?? '') === 'Rejected' && isset($request['approvedDate'])) $logStmt->execute([$id, 'Request Rejected', (string)($request['approvedBy'] ?? 'Admin'), textValue($request, 'approvedDate'), 'Rejected for ' . (string)($request['studentName'] ?? '')]);
        if (isset($request['returnDate'])) $logStmt->execute([$id, ($request['status'] ?? '') === 'Missing' ? 'Reported Missing' : 'Item Returned', (string)($request['studentName'] ?? ''), textValue($request, 'returnDate'), 'Condition: ' . (string)($request['conditionAfter'] ?? '')]);
        if (($request['penalty'] ?? 0) > 0) {
            $penaltyStmt->execute([$id, (string)($request['studentId'] ?? ''), (string)($request['studentName'] ?? ''), (string)($request['equipmentName'] ?? ''), !empty($request['reportedMissing']) ? 'Missing Item' : 'Overdue Return', (float)$request['penalty'], (int)($request['overdueHours'] ?? 0), !empty($request['penaltyPaid']) ? 1 : 0, textValue($request, 'penaltyPaymentMethod'), textValue($request, 'penaltyPaymentDate'), textValue($request, 'returnDate')]);
        }
        if (!empty($request['penaltyPaid']) && isset($request['penaltyPaymentDate'])) $logStmt->execute([$id, 'Penalty Paid', (string)($request['studentName'] ?? ''), textValue($request, 'penaltyPaymentDate'), (string)($request['penaltyPaymentMethod'] ?? '')]);
    }

    $db->commit();
    respond(['ok' => true, 'updated_at' => date(DATE_ATOM)]);
} catch (Throwable $error) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) $db->rollBack();
    respond(['error' => 'Database operation failed', 'detail' => $error->getMessage()], 500);
}
