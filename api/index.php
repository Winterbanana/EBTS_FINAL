<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
$allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost', 'http://127.0.0.1'];
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

const DB_HOST = '127.0.0.1';
const DB_NAME = 'wcc_equipment_system';
const DB_USER = 'root';
const DB_PASS = '';
const STATE_SNAPSHOT_ENCODING_PREFIX = 'gz64:';

function respond(array $payload, int $status = 200): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function decodeStateSnapshot(?string $storedState): ?array {
    if ($storedState === null || $storedState === '') return null;

    if (str_starts_with($storedState, STATE_SNAPSHOT_ENCODING_PREFIX)) {
        $compressed = base64_decode(substr($storedState, strlen(STATE_SNAPSHOT_ENCODING_PREFIX)), true);
        if ($compressed === false) throw new RuntimeException('Saved application state has invalid compressed data.');
        $json = gzdecode($compressed);
        if ($json === false) throw new RuntimeException('Saved application state could not be decompressed.');
        $state = json_decode($json, true);
        if (!is_array($state)) throw new RuntimeException('Saved application state contains invalid JSON.');
        return $state;
    }

    $state = json_decode($storedState, true);
    return is_array($state) ? $state : null;
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
        brand VARCHAR(100) NOT NULL DEFAULT 'WCC', category VARCHAR(100) NOT NULL,
        program VARCHAR(120) NOT NULL DEFAULT '', qrcode VARCHAR(100) NOT NULL, photo_url VARCHAR(255) NULL,
        total_stock INT DEFAULT 1, available_stock INT DEFAULT 1, borrowed_stock INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Available', borrowed_by VARCHAR(200) NULL,
        borrow_date DATE NULL, due_date DATE NULL, quality_condition VARCHAR(20) DEFAULT 'Excellent',
        last_condition_update DATE NULL, condition_notes TEXT NULL, last_borrowed_by VARCHAR(200) NULL,
        metadata_json LONGTEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $db->exec("CREATE TABLE IF NOT EXISTS wcc_transactions (
        id VARCHAR(20) NOT NULL PRIMARY KEY, student_id VARCHAR(50) NOT NULL, student_name VARCHAR(150) NOT NULL,
        student_course VARCHAR(50) NULL, student_contact VARCHAR(30) NULL, equipment_id VARCHAR(20) NOT NULL,
        equipment_name VARCHAR(100) NOT NULL, equipment_brand VARCHAR(100) NULL, equipment_program VARCHAR(120) NULL,
        equipment_qrcode VARCHAR(100) NULL, request_date DATE NULL,
        due_date DATE NULL, borrow_time VARCHAR(10) NULL, due_time VARCHAR(10) NULL, return_date DATE NULL,
        return_time VARCHAR(10) NULL, status VARCHAR(20) DEFAULT 'Pending', approved_by VARCHAR(100) NULL,
        approved_date DATE NULL, condition_before VARCHAR(20) NULL, condition_after VARCHAR(20) NULL,
        condition_notes TEXT NULL, resolution_status VARCHAR(20) NULL, metadata_json LONGTEXT NULL
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
        amount DECIMAL(10,2) NOT NULL DEFAULT 0, overdue_hours INT DEFAULT 0, overdue_days INT DEFAULT 0,
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
    foreach ([
        'wcc_equipment' => [
            'brand' => "VARCHAR(100) NOT NULL DEFAULT 'WCC'",
            'program' => "VARCHAR(120) NOT NULL DEFAULT ''",
            'photo_url' => 'VARCHAR(255) NULL',
            'marked_missing_date' => 'DATE NULL',
            'marked_missing_by' => 'VARCHAR(100) NULL'
        ],
        'wcc_transactions' => [
            'equipment_brand' => 'VARCHAR(100) NULL',
            'equipment_program' => 'VARCHAR(120) NULL',
            'resolution_status' => 'VARCHAR(20) NULL'
        ],
        'wcc_penalty_records' => [
            'overdue_days' => 'INT DEFAULT 0'
        ]
    ] as $table => $columns) {
        foreach ($columns as $column => $definition) {
            try { $db->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition"); } catch (Throwable $ignored) {}
        }
    }
    try { $db->exec("ALTER TABLE wcc_equipment MODIFY status VARCHAR(20) DEFAULT 'Available'"); } catch (Throwable $ignored) {}
}

function textValue(array $row, string $key): ?string {
    return isset($row[$key]) && $row[$key] !== '' ? (string)$row[$key] : null;
}

function numberValue(array $row, string $key, int $default = 0): int {
    return isset($row[$key]) ? (int)$row[$key] : $default;
}

const MAX_ACTIVE_BORROW_LIMIT = 3;

function countStudentActiveBorrows(array $requests, string $studentId): int {
    $count = 0;
    foreach ($requests as $request) {
        if (!is_array($request)) continue;
        if ((string)($request['studentId'] ?? '') !== $studentId) continue;
        if ((string)($request['status'] ?? '') === 'Approved') {
            $count++;
        }
    }
    return $count;
}

function validateBorrowingLimit(array $state): void {
    $requests = $state['requests'] ?? [];
    $counts = [];
    foreach ($requests as $request) {
        if (!is_array($request)) continue;
        $studentId = (string)($request['studentId'] ?? '');
        if ($studentId === '') continue;
        if ((string)($request['status'] ?? '') !== 'Approved') continue;
        $counts[$studentId] = ($counts[$studentId] ?? 0) + 1;
    }
    foreach ($counts as $studentId => $count) {
        if ($count > MAX_ACTIVE_BORROW_LIMIT) {
            respond([
                'error' => 'Borrowing limit reached. Each student may borrow a maximum of 3 items at a time. Please return an item before borrowing another.',
                'studentId' => $studentId,
                'borrowedItems' => $count,
                'limit' => MAX_ACTIVE_BORROW_LIMIT,
            ], 409);
        }
    }
}

function mergeRecords(array $existing, array $incoming): array {
    $records = [];
    foreach ($existing as $record) {
        if (is_array($record) && isset($record['id'])) $records[(string)$record['id']] = $record;
    }
    foreach ($incoming as $record) {
        if (is_array($record) && isset($record['id'])) {
            $id = (string)$record['id'];
            $records[$id] = array_merge($records[$id] ?? [], $record);
        }
    }
    return array_values($records);
}

function changedRecords(array $existing, array $incoming): array {
    $byId = [];
    foreach ($existing as $record) {
        if (is_array($record) && isset($record['id'])) $byId[(string)$record['id']] = $record;
    }
    $changed = [];
    foreach ($incoming as $record) {
        if (!is_array($record) || !isset($record['id'])) continue;
        $id = (string)$record['id'];
        if (!isset($byId[$id]) || $byId[$id] != $record) $changed[] = $record;
    }
    return $changed;
}

function decodedMetadata(array $row): array {
    $metadata = json_decode((string)($row['metadata_json'] ?? ''), true);
    return is_array($metadata) ? $metadata : [];
}

function loadNormalizedState(PDO $db): ?array {
    $users = [];
    foreach ($db->query('SELECT * FROM wcc_users')->fetchAll() as $row) {
        $users[] = array_merge(decodedMetadata($row), [
            'id' => (string)$row['id'], 'password' => (string)$row['password'], 'role' => (string)$row['role'],
            'name' => (string)$row['name'], 'email' => $row['email'], 'course' => $row['course'],
            'section' => $row['section'], 'contact' => $row['contact'], 'canBorrow' => (bool)$row['can_borrow'],
            'missingItemDebt' => (float)$row['missing_item_debt']
        ]);
    }
    $equipment = [];
    foreach ($db->query('SELECT * FROM wcc_equipment')->fetchAll() as $row) {
        $equipment[] = array_merge(decodedMetadata($row), [
            'id' => (string)$row['id'], 'name' => (string)$row['name'], 'brand' => (string)$row['brand'],
            'category' => (string)$row['category'], 'program' => (string)$row['program'], 'qrcode' => (string)$row['qrcode'],
            'photoUrl' => $row['photo_url'], 'totalStock' => (int)$row['total_stock'],
            'availableStock' => (int)$row['available_stock'], 'borrowedStock' => (int)$row['borrowed_stock'],
            'status' => (string)$row['status'], 'borrowedBy' => $row['borrowed_by'], 'borrowDate' => $row['borrow_date'],
            'dueDate' => $row['due_date'], 'qualityCondition' => (string)$row['quality_condition'],
            'lastConditionUpdate' => $row['last_condition_update'], 'conditionNotes' => $row['condition_notes'],
            'lastBorrowedBy' => $row['last_borrowed_by'], 'markedMissingDate' => $row['marked_missing_date'] ?? null,
            'markedMissingBy' => $row['marked_missing_by'] ?? null
        ]);
    }
    $requests = [];
    foreach ($db->query('SELECT * FROM wcc_transactions')->fetchAll() as $row) {
        $requests[] = array_merge(decodedMetadata($row), [
            'id' => (string)$row['id'], 'studentId' => (string)$row['student_id'], 'studentName' => (string)$row['student_name'],
            'studentCourse' => $row['student_course'], 'studentContact' => $row['student_contact'],
            'equipmentId' => (string)$row['equipment_id'], 'equipmentName' => (string)$row['equipment_name'],
            'equipmentBrand' => $row['equipment_brand'], 'equipmentProgram' => $row['equipment_program'],
            'equipmentQRCode' => $row['equipment_qrcode'], 'requestDate' => $row['request_date'], 'dueDate' => $row['due_date'],
            'borrowTime' => $row['borrow_time'], 'dueTime' => $row['due_time'], 'returnDate' => $row['return_date'],
            'returnTime' => $row['return_time'], 'status' => (string)$row['status'], 'approvedBy' => $row['approved_by'],
            'approvedDate' => $row['approved_date'], 'conditionBefore' => $row['condition_before'],
            'conditionAfter' => $row['condition_after'], 'conditionNotes' => $row['condition_notes']
        ]);
    }
    if (!$users && !$equipment && !$requests) return null;
    return ['users' => $users, 'equipment' => $equipment, 'requests' => $requests, 'equipmentAuditLogs' => [], 'inventoryVersion' => 0, 'revision' => 0];
}

function insertHistoryOnce(PDO $db, string $sql, array $values, string $matchSql, array $matchValues): void {
    $check = $db->prepare($matchSql);
    $check->execute($matchValues);
    if (!$check->fetchColumn()) {
        $insert = $db->prepare($sql);
        $insert->execute($values);
    }
}

function syncOverduePenaltyRecord(PDO $db, array $request): void {
    $transactionId = (string)$request['id'];
    $penaltyPaid = !empty($request['penaltyPaid']) || ($request['penaltyPaymentStatus'] ?? '') === 'Paid';
    $values = [
        (string)($request['studentId'] ?? ''),
        (string)($request['studentName'] ?? ''),
        (string)($request['equipmentName'] ?? ''),
        (float)($request['penalty'] ?? 0),
        (int)($request['overdueHours'] ?? 0),
        (int)($request['overdueDays'] ?? 0),
        $penaltyPaid ? 1 : 0,
        textValue($request, 'penaltyPaymentMethod'),
        $penaltyPaid ? textValue($request, 'penaltyPaymentDate') : null,
        textValue($request, 'returnDate'),
    ];
    $find = $db->prepare("SELECT id FROM wcc_penalty_records WHERE transaction_id=? AND penalty_type='Overdue Return' ORDER BY id LIMIT 1");
    $find->execute([$transactionId]);
    if ($find->fetchColumn()) {
        $update = $db->prepare("UPDATE wcc_penalty_records SET student_id=?,student_name=?,equipment_name=?,amount=?,overdue_hours=?,overdue_days=?,penalty_paid=?,payment_method=?,payment_date=?,return_date=? WHERE transaction_id=? AND penalty_type='Overdue Return'");
        $update->execute([...$values, $transactionId]);
        return;
    }
    $insert = $db->prepare("INSERT INTO wcc_penalty_records (transaction_id,student_id,student_name,equipment_name,penalty_type,amount,overdue_hours,overdue_days,penalty_paid,payment_method,payment_date,return_date) VALUES (?,?,?,?,'Overdue Return',?,?,?,?,?,?,?)");
    $insert->execute([$transactionId, ...$values]);
}

function validateEquipmentPhotos(array $equipment): void {
    $assetRoot = realpath(__DIR__ . '/../public/equipment');
    foreach ($equipment as $item) {
        if (!is_array($item)) continue;
        $photo = textValue($item, 'photoUrl');
        if ($photo === null || !str_starts_with($photo, '/equipment/')) continue;
        $path = rawurldecode((string)(parse_url($photo, PHP_URL_PATH) ?? ''));
        $filename = basename($path);
        $resolved = $assetRoot ? realpath($assetRoot . DIRECTORY_SEPARATOR . $filename) : false;
        if (!$resolved || !is_file($resolved) || !str_starts_with($resolved, $assetRoot . DIRECTORY_SEPARATOR)) {
            respond(['error' => 'Equipment photo is missing from the public equipment folder', 'equipment_id' => (string)($item['id'] ?? '')], 422);
        }
    }
}

try {
    $db = database();
    ensureSchema($db);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $row = $db->query('SELECT state_json FROM wcc_app_state WHERE id = 1')->fetch();
        $state = $row ? decodeStateSnapshot((string)$row['state_json']) : null;
        $normalized = loadNormalizedState($db);
        if (is_array($state) && $normalized) {
            foreach (['users', 'equipment', 'requests'] as $key) {
                $state[$key] = mergeRecords($state[$key] ?? [], $normalized[$key] ?? []);
            }
        } elseif (!$state && $normalized) {
            $state = $normalized;
        }
        $configured = is_array($state)
            && !empty($state['users'])
            && !empty($state['equipment']);
        respond(['configured' => $configured, 'data' => $configured ? $state : null, 'revision' => (int)($state['revision'] ?? 0)]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Method not allowed'], 405);
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body) || !isset($body['users'], $body['equipment'], $body['requests'])) {
        respond(['error' => 'Invalid application state payload'], 400);
    }
    validateEquipmentPhotos($body['equipment']);
    validateBorrowingLimit($body);

    $incomingVersion = (int)($body['inventoryVersion'] ?? 0);
    $incomingRevision = (int)($body['revision'] ?? 0);
    $lock = $db->query("SELECT GET_LOCK('ebts_app_state_save', 5)")->fetchColumn();
    if ((int)$lock !== 1) respond(['error' => 'Could not obtain the database save lock. Retry the change.'], 503);
    $db->beginTransaction();
    $storedSnapshot = $db->query('SELECT state_json FROM wcc_app_state WHERE id = 1 FOR UPDATE')->fetch();
    $storedState = $storedSnapshot ? decodeStateSnapshot((string)$storedSnapshot['state_json']) : null;
    $normalizedState = loadNormalizedState($db);
    if (!is_array($storedState)) $storedState = $normalizedState ?? [];
    elseif ($normalizedState) {
        foreach (['users', 'equipment', 'requests'] as $key) {
            $storedState[$key] = mergeRecords($storedState[$key] ?? [], $normalizedState[$key] ?? []);
        }
    }
    $storedRevision = (int)($storedState['revision'] ?? 0);
    if ($storedRevision !== $incomingRevision) {
        $db->rollBack();
        respond(['error' => 'The database changed in another session. Reload the application before saving changes.', 'revision' => $storedRevision], 409);
    }

    $storedState = is_array($storedState) ? $storedState : [];
    $previousRequests = [];
    foreach (($storedState['requests'] ?? []) as $previousRequest) {
        if (is_array($previousRequest) && isset($previousRequest['id'])) $previousRequests[(string)$previousRequest['id']] = $previousRequest;
    }
    $mergedUsers = mergeRecords($storedState['users'] ?? [], $body['users']);
    $mergedEquipment = mergeRecords($storedState['equipment'] ?? [], $body['equipment']);
    $mergedRequests = mergeRecords($storedState['requests'] ?? [], $body['requests']);
    $mergedAuditLogs = mergeRecords($storedState['equipmentAuditLogs'] ?? [], $body['equipmentAuditLogs'] ?? []);
    $changedUsers = changedRecords($storedState['users'] ?? [], $body['users']);
    $changedEquipment = changedRecords($storedState['equipment'] ?? [], $body['equipment']);
    $changedRequests = changedRecords($storedState['requests'] ?? [], $body['requests']);
    $changedAuditLogs = changedRecords($storedState['equipmentAuditLogs'] ?? [], $body['equipmentAuditLogs'] ?? []);
    $catalogChanged = $incomingVersion > (int)($storedState['inventoryVersion'] ?? 0);
    if (!$changedUsers && !$changedEquipment && !$changedRequests && !$changedAuditLogs && !$catalogChanged) {
        $db->commit();
        $db->query("SELECT RELEASE_LOCK('ebts_app_state_save')");
        respond(['ok' => true, 'revision' => $storedRevision, 'unchanged' => true, 'updated_at' => date(DATE_ATOM)]);
    }
    $nextRevision = $storedRevision + 1;

    $stateJson = json_encode([
        'users' => $mergedUsers,
        'equipment' => $mergedEquipment,
        'requests' => $mergedRequests,
        'equipmentAuditLogs' => $mergedAuditLogs,
        'inventoryVersion' => max($incomingVersion, (int)($storedState['inventoryVersion'] ?? 0)),
        'revision' => $nextRevision
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($stateJson === false) {
        $db->rollBack();
        respond(['error' => 'State could not be encoded'], 400);
    }
    $compressedState = gzencode($stateJson, 6);
    if ($compressedState === false) {
        $db->rollBack();
        respond(['error' => 'State could not be compressed for database storage'], 500);
    }
    $storedStateJson = STATE_SNAPSHOT_ENCODING_PREFIX . base64_encode($compressedState);

    $saveState = $db->prepare('INSERT INTO wcc_app_state (id, state_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json)');
    $saveState->execute([$storedStateJson]);

    $userSql = 'INSERT INTO wcc_users (id,password,role,name,email,course,section,contact,can_borrow,missing_item_debt,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE password=VALUES(password),role=VALUES(role),name=VALUES(name),email=VALUES(email),course=VALUES(course),section=VALUES(section),contact=VALUES(contact),can_borrow=VALUES(can_borrow),missing_item_debt=VALUES(missing_item_debt),metadata_json=VALUES(metadata_json)';
    $userStmt = $db->prepare($userSql);
    foreach ($changedUsers as $user) {
        if (!is_array($user) || !isset($user['id'])) continue;
        $userStmt->execute([
            (string)$user['id'], (string)($user['password'] ?? ''), (string)($user['role'] ?? 'student'),
            (string)($user['name'] ?? ''), textValue($user, 'email'), textValue($user, 'course'), textValue($user, 'section'),
            textValue($user, 'contact'), ($user['canBorrow'] ?? true) === false ? 0 : 1, (float)($user['missingItemDebt'] ?? 0), json_encode($user)
        ]);
    }

    $equipmentSql = 'INSERT INTO wcc_equipment (id,name,brand,category,program,qrcode,photo_url,total_stock,available_stock,borrowed_stock,status,borrowed_by,borrow_date,due_date,quality_condition,last_condition_update,condition_notes,last_borrowed_by,marked_missing_date,marked_missing_by,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),brand=VALUES(brand),category=VALUES(category),program=VALUES(program),qrcode=VALUES(qrcode),photo_url=VALUES(photo_url),total_stock=VALUES(total_stock),available_stock=VALUES(available_stock),borrowed_stock=VALUES(borrowed_stock),status=VALUES(status),borrowed_by=VALUES(borrowed_by),borrow_date=VALUES(borrow_date),due_date=VALUES(due_date),quality_condition=VALUES(quality_condition),last_condition_update=VALUES(last_condition_update),condition_notes=VALUES(condition_notes),last_borrowed_by=VALUES(last_borrowed_by),marked_missing_date=VALUES(marked_missing_date),marked_missing_by=VALUES(marked_missing_by),metadata_json=VALUES(metadata_json)';
    $equipmentStmt = $db->prepare($equipmentSql);
    foreach ($changedEquipment as $item) {
        if (!is_array($item) || !isset($item['id'])) continue;
        $equipmentStmt->execute([
            (string)$item['id'], (string)($item['name'] ?? ''), (string)($item['brand'] ?? 'WCC'), (string)($item['category'] ?? 'Uncategorized'),
            (string)($item['program'] ?? ''), (string)($item['qrcode'] ?? ''), textValue($item, 'photoUrl'),
            numberValue($item, 'totalStock', 1), numberValue($item, 'availableStock', 1), numberValue($item, 'borrowedStock'),
            (string)($item['status'] ?? 'Available'), textValue($item, 'borrowedBy'), textValue($item, 'borrowDate'), textValue($item, 'dueDate'),
            (string)($item['qualityCondition'] ?? 'Excellent'), textValue($item, 'lastConditionUpdate'), textValue($item, 'conditionNotes'), textValue($item, 'lastBorrowedBy'),
            textValue($item, 'markedMissingDate'), textValue($item, 'markedMissingBy'), json_encode($item)
        ]);
    }

    $transactionSql = 'INSERT INTO wcc_transactions (id,student_id,student_name,student_course,student_contact,equipment_id,equipment_name,equipment_brand,equipment_program,equipment_qrcode,request_date,due_date,borrow_time,due_time,return_date,return_time,status,approved_by,approved_date,condition_before,condition_after,condition_notes,resolution_status,metadata_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE student_id=VALUES(student_id),student_name=VALUES(student_name),student_course=VALUES(student_course),student_contact=VALUES(student_contact),equipment_id=VALUES(equipment_id),equipment_name=VALUES(equipment_name),equipment_brand=VALUES(equipment_brand),equipment_program=VALUES(equipment_program),equipment_qrcode=VALUES(equipment_qrcode),request_date=VALUES(request_date),due_date=VALUES(due_date),borrow_time=VALUES(borrow_time),due_time=VALUES(due_time),return_date=VALUES(return_date),return_time=VALUES(return_time),status=VALUES(status),approved_by=VALUES(approved_by),approved_date=VALUES(approved_date),condition_before=VALUES(condition_before),condition_after=VALUES(condition_after),condition_notes=VALUES(condition_notes),resolution_status=VALUES(resolution_status),metadata_json=VALUES(metadata_json)';
    $transactionStmt = $db->prepare($transactionSql);
    foreach ($changedRequests as $request) {
        if (!is_array($request) || !isset($request['id'])) continue;
        $transactionStmt->execute([
            (string)$request['id'], (string)($request['studentId'] ?? ''), (string)($request['studentName'] ?? ''), textValue($request, 'studentCourse'), textValue($request, 'studentContact'),
            (string)($request['equipmentId'] ?? ''), (string)($request['equipmentName'] ?? ''), textValue($request, 'equipmentBrand'), textValue($request, 'equipmentProgram'),
            textValue($request, 'equipmentQRCode'), textValue($request, 'requestDate'), textValue($request, 'dueDate'),
            textValue($request, 'borrowTime'), textValue($request, 'dueTime'), textValue($request, 'returnDate'), textValue($request, 'returnTime'), (string)($request['status'] ?? 'Pending'),
            textValue($request, 'approvedBy'), textValue($request, 'approvedDate'), textValue($request, 'conditionBefore'), textValue($request, 'conditionAfter'), textValue($request, 'conditionNotes'),
            !empty($request['missingItemReturned']) ? 'Returned' : (!empty($request['missingItemPaid']) ? 'Paid' : null), json_encode($request)
        ]);
    }

    $logSql = 'INSERT INTO wcc_transaction_logs (transaction_id,event,actor,event_date,detail) VALUES (?,?,?,?,?)';
    $logMatchSql = 'SELECT 1 FROM wcc_transaction_logs WHERE transaction_id=? AND event=? AND actor=? AND event_date <=> ? AND detail <=> ? LIMIT 1';
    foreach ($mergedRequests as $request) {
        if (!is_array($request) || !isset($request['id'])) continue;
        $id = (string)$request['id'];
        $previousRequest = $previousRequests[$id] ?? null;
        $isNewRequest = $previousRequest === null;
        $paymentIsPaid = !empty($request['penaltyPaid']) || ($request['penaltyPaymentStatus'] ?? '') === 'Paid';
        $previousPaymentIsPaid = !empty($previousRequest['penaltyPaid']) || ($previousRequest['penaltyPaymentStatus'] ?? '') === 'Paid';
        $statusChanged = $isNewRequest || ($previousRequest['status'] ?? null) !== ($request['status'] ?? null);
        $returnChanged = $statusChanged
            || ($previousRequest['returnDate'] ?? null) !== ($request['returnDate'] ?? null)
            || ($previousRequest['missingItemReturned'] ?? false) !== ($request['missingItemReturned'] ?? false);
        if ($isNewRequest && isset($request['requestDate'])) {
            $values = [$id, 'Request Submitted', (string)($request['studentName'] ?? ''), textValue($request, 'requestDate'), 'Equipment: ' . (string)($request['equipmentName'] ?? '')];
            insertHistoryOnce($db, $logSql, $values, $logMatchSql, $values);
        }
        if ($statusChanged && ($request['status'] ?? '') === 'Approved' && isset($request['approvedDate'])) {
            $values = [$id, 'Request Approved', (string)($request['approvedBy'] ?? 'Admin'), textValue($request, 'approvedDate'), 'Approved for ' . (string)($request['studentName'] ?? '')];
            insertHistoryOnce($db, $logSql, $values, $logMatchSql, $values);
        }
        if ($statusChanged && ($request['status'] ?? '') === 'Rejected' && isset($request['approvedDate'])) {
            $values = [$id, 'Request Rejected', (string)($request['approvedBy'] ?? 'Admin'), textValue($request, 'approvedDate'), 'Rejected for ' . (string)($request['studentName'] ?? '')];
            insertHistoryOnce($db, $logSql, $values, $logMatchSql, $values);
        }
        if ($returnChanged && isset($request['returnDate'])) {
            $values = [$id, !empty($request['missingItemReturned']) ? 'Missing Item Returned' : (($request['status'] ?? '') === 'Missing' ? 'Reported Missing' : 'Item Returned'), (string)($request['approvedBy'] ?? $request['studentName'] ?? 'Admin'), textValue($request, 'missingItemReturnDate') ?? textValue($request, 'returnDate'), 'Condition: ' . (string)($request['conditionAfter'] ?? '')];
            insertHistoryOnce($db, $logSql, $values, $logMatchSql, $values);
        }
        if (($request['penaltyPaymentStatus'] ?? '') === 'Pending'
            && (($previousRequest['penaltyPaymentStatus'] ?? null) !== 'Pending'
                || ($previousRequest['penaltyPaymentSubmittedDate'] ?? null) !== ($request['penaltyPaymentSubmittedDate'] ?? null))
            && isset($request['penaltyPaymentSubmittedDate'])) {
            $values = [$id, 'Penalty Payment Submitted', (string)($request['studentName'] ?? ''), textValue($request, 'penaltyPaymentSubmittedDate'), (string)($request['penaltyPaymentMethod'] ?? '')];
            insertHistoryOnce($db, $logSql, $values, $logMatchSql, $values);
        }
        if (!empty($request['missingItemPaid']) && empty($previousRequest['missingItemPaid'])) {
            $values = [$id, 'Missing Item Fee Paid', (string)($request['approvedBy'] ?? 'Admin'), textValue($request, 'missingItemPaymentDate'), 'Replacement fee: 200'];
            insertHistoryOnce($db, $logSql, $values, $logMatchSql, $values);
        }
        if (!empty($request['missingItemPaid']) && empty($previousRequest['missingItemPaid'])) {
            insertHistoryOnce($db, 'INSERT INTO wcc_penalty_records (transaction_id,student_id,student_name,equipment_name,penalty_type,amount,overdue_hours,overdue_days,penalty_paid,payment_method,payment_date,return_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [$id, (string)($request['studentId'] ?? ''), (string)($request['studentName'] ?? ''), (string)($request['equipmentName'] ?? ''), 'Missing Item', 200, 0, 0, 1, 'Staff verified', textValue($request, 'missingItemPaymentDate'), textValue($request, 'missingItemReturnDate')], 'SELECT 1 FROM wcc_penalty_records WHERE transaction_id=? AND penalty_type=? LIMIT 1', [$id, 'Missing Item']);
        }
        if ($paymentIsPaid && !$previousPaymentIsPaid && isset($request['penaltyPaymentDate'])) {
            $values = [$id, 'Penalty Paid', (string)($request['penaltyVerifiedBy'] ?? $request['approvedBy'] ?? 'Staff'), textValue($request, 'penaltyPaymentDate'), (string)($request['penaltyPaymentMethod'] ?? '')];
            insertHistoryOnce($db, $logSql, $values, $logMatchSql, $values);
        }
    }

    foreach ($changedRequests as $request) {
        if (is_array($request) && isset($request['id']) && (float)($request['penalty'] ?? 0) > 0) {
            syncOverduePenaltyRecord($db, $request);
        }
    }

    foreach ($changedAuditLogs as $auditLog) {
        if (!is_array($auditLog) || empty($auditLog['equipmentId']) || empty($auditLog['event'])) continue;
        $values = [
            (string)$auditLog['equipmentId'],
            (string)$auditLog['event'],
            (string)($auditLog['actor'] ?? 'Admin'),
            textValue($auditLog, 'date'),
            textValue($auditLog, 'detail'),
        ];
        insertHistoryOnce($db, $logSql, $values, $logMatchSql, $values);
    }

    $db->commit();
    $db->query("SELECT RELEASE_LOCK('ebts_app_state_save')");
    respond(['ok' => true, 'revision' => $nextRevision, 'updated_at' => date(DATE_ATOM)]);
} catch (Throwable $error) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) {
        try {
            $db->rollBack();
        } catch (Throwable $rollbackError) {
            error_log('Database rollback failed after save error: ' . $rollbackError->getMessage());
        }
    }
    if (isset($db) && $db instanceof PDO) {
        try { $db->query("SELECT RELEASE_LOCK('ebts_app_state_save')"); } catch (Throwable $ignored) {}
    }
    respond(['error' => 'Database operation failed', 'detail' => $error->getMessage()], 500);
}
