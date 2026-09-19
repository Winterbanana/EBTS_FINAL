-- ============================================================
-- WCC Equipment Borrowing and Tracking Return System
-- XAMPP / phpMyAdmin Import File
-- Version: 2.2.0
-- Generated: 2026-07-26
--
-- HOW TO IMPORT:
--   1. Open phpMyAdmin  →  http://localhost/phpmyadmin
--   2. Click the "Import" tab
--   3. Choose this file (wcc_equipment_system.sql)
--   4. Click "Go"
--
--   OR via MySQL CLI:
--   mysql -u root -p < wcc_equipment_system.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `wcc_equipment_system`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `wcc_equipment_system`;

CREATE TABLE IF NOT EXISTS `wcc_app_state` (
  `id` TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  `state_json` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: wcc_users  (Store User Data)
-- ============================================================
CREATE TABLE IF NOT EXISTS `wcc_users` (
  `id`                VARCHAR(50)  NOT NULL PRIMARY KEY,
  `password`          VARCHAR(255) NOT NULL,
  `role`              ENUM('student','admin','staff') NOT NULL,
  `name`              VARCHAR(150) NOT NULL,
  `email`             VARCHAR(150) DEFAULT NULL,
  `course`            VARCHAR(50)  DEFAULT NULL,
  `section`           VARCHAR(20)  DEFAULT NULL,
  `contact`           VARCHAR(30)  DEFAULT NULL,
  `can_borrow`        TINYINT(1)   DEFAULT 1,
  `missing_item_debt` DECIMAL(10,2) DEFAULT 0.00,
  `metadata_json`    LONGTEXT DEFAULT NULL,
  `created_at`        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student Credentials
INSERT IGNORE INTO `wcc_users` (`id`,`password`,`role`,`name`,`email`,`course`,`section`,`contact`,`can_borrow`,`missing_item_debt`) VALUES
('2024-07-001234','student123','student','TUGADE, MARK JOSEPH',  'tugademarky010@gmail.com','BSIT','204','09123456789',   1,0.00),
('2024-07-002314','student123','student','GO, JOHNRE MATTHEW',   'go@gmail.com',            'BSIT','204','0912323132321', 1,0.00),
('2024-07-004321','student123','student','SAMSON, JOHN PATRICK', 'johnpatrick@gmail.com',   'BSIT','204','09123231121',   1,0.00),
('2024-07-002431','student123','student','YAP, JHASHZEL',        'yapjash@gmail.com',       'BSIT','204','09123431231231',1,0.00),
('2026-07-007777','student123','student','TOLEDO, ELIEZER',      'toledo.eliezer@wcc.edu.ph','BSIT','204','09000000001',  1,0.00),
('2026-07-001111','student123','student','RUCIO, JENSON',        'rucio.jenson@wcc.edu.ph', 'BSIT','204','09000000002',  1,0.00);

-- Admin Credentials (Max 2)
INSERT IGNORE INTO `wcc_users` (`id`,`password`,`role`,`name`,`email`,`can_borrow`,`missing_item_debt`) VALUES
('ADM2024','admin123','admin','MARK TUGADE','tugademarky010@gmail.com',1,0.00),
('ADM2025','admin123','admin','GO JOHNREE', 'go@gmail.com',            1,0.00);

-- Staff Credentials (Max 2)
INSERT IGNORE INTO `wcc_users` (`id`,`password`,`role`,`name`,`email`,`can_borrow`,`missing_item_debt`) VALUES
('2024-07-00123','staff123','staff','MARK TUGADE','tugademarky010@gmail.com',1,0.00),
('2024-07-00456','staff123','staff','GO JOHNREE', 'go@gmail.com',            1,0.00);

-- ============================================================
-- TABLE: wcc_equipment  (Store Equipment Data)
-- ============================================================
CREATE TABLE IF NOT EXISTS `wcc_equipment` (
  `id`                   VARCHAR(20)  NOT NULL PRIMARY KEY,
  `name`                 VARCHAR(100) NOT NULL,
  `category`             VARCHAR(100) NOT NULL,
  `qrcode`               VARCHAR(100) NOT NULL,
  `total_stock`          INT          DEFAULT 1,
  `available_stock`      INT          DEFAULT 1,
  `borrowed_stock`       INT          DEFAULT 0,
  `status`               ENUM('Available','Borrowed','Missing') DEFAULT 'Available',
  `borrowed_by`          VARCHAR(200) DEFAULT NULL,
  `borrow_date`          DATE         DEFAULT NULL,
  `due_date`             DATE         DEFAULT NULL,
  `quality_condition`    ENUM('Excellent','Good','Fair','Poor','Damaged') DEFAULT 'Excellent',
  `last_condition_update` DATE        DEFAULT NULL,
  `condition_notes`      TEXT         DEFAULT NULL,
  `last_borrowed_by`     VARCHAR(200) DEFAULT NULL,
  `marked_missing_date`  DATE         DEFAULT NULL,
  `marked_missing_by`    VARCHAR(100) DEFAULT NULL,
  `metadata_json`        LONGTEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `wcc_equipment` (`id`,`name`,`category`,`qrcode`,`total_stock`,`available_stock`,`borrowed_stock`,`status`,`borrowed_by`,`borrow_date`,`due_date`,`quality_condition`,`last_condition_update`) VALUES
('EQ001','Screwdriver Set',    'Screwdriver Set','EQ001-QR-2024',5,5,0,'Available',NULL,       NULL,         NULL,         'Excellent','2026-02-01'),
('EQ002','LAN Cable Set',      'LAN Cable Set',  'EQ002-QR-2024',4,3,1,'Available','TUGADE, MARK JOSEPH (1 unit)','2026-02-10','2026-02-17','Excellent','2026-02-10'),
('EQ003','Cable Pliers',       'Cable Pliers',   'EQ003-QR-2024',3,3,0,'Available',NULL,       NULL,         NULL,         'Excellent','2026-02-01'),
('EQ004','Wire Spool',         'Wires',          'EQ004-QR-2024',5,5,0,'Available',NULL,       NULL,         NULL,         'Excellent','2026-02-01'),
('EQ005','RJ45 Connector Pack','RJ45',           'EQ005-QR-2024',5,5,0,'Available',NULL,       NULL,         NULL,         'Excellent','2026-02-01'),
('EQ006','LAN Cable (Ethernet)','LAN Cables',    'EQ006-QR-2024',5,5,0,'Available',NULL,       NULL,         NULL,         'Excellent','2026-02-01'),
('EQ007','Cooking Tool Set',   'Cooking Tool Set','EQ007-QR-2024',3,2,1,'Available','GO, JOHNRE MATTHEW (1 unit)','2026-02-15','2026-02-20','Excellent','2026-02-15'),
('EQ008','Projector',          'Projectors',     'EQ008-QR-2024',2,1,1,'Available','SAMSON, JOHN PATRICK (1 unit)','2026-02-12','2026-02-19','Good',     '2026-02-12'),
('EQ009','HDMI Cable',         'HDMI Cables',    'EQ009-QR-2024',4,4,0,'Available',NULL,       NULL,         NULL,         'Excellent','2026-02-01'),
('EQ010','First Aid Kit',      'First Aid Kits', 'EQ010-QR-2024',3,3,0,'Available',NULL,       NULL,         NULL,         'Excellent','2026-02-01');

-- ============================================================
-- TABLE: wcc_transactions  (Store Transactions)
-- ============================================================
CREATE TABLE IF NOT EXISTS `wcc_transactions` (
  `id`               VARCHAR(20)  NOT NULL PRIMARY KEY,
  `student_id`       VARCHAR(50)  NOT NULL,
  `student_name`     VARCHAR(150) NOT NULL,
  `student_course`   VARCHAR(50)  DEFAULT NULL,
  `student_contact`  VARCHAR(30)  DEFAULT NULL,
  `equipment_id`     VARCHAR(20)  NOT NULL,
  `equipment_name`   VARCHAR(100) NOT NULL,
  `equipment_qrcode` VARCHAR(100) DEFAULT NULL,
  `request_date`     DATE         DEFAULT NULL,
  `due_date`         DATE         DEFAULT NULL,
  `borrow_time`      VARCHAR(10)  DEFAULT NULL,
  `due_time`         VARCHAR(10)  DEFAULT NULL,
  `return_date`      DATE         DEFAULT NULL,
  `return_time`      VARCHAR(10)  DEFAULT NULL,
  `status`           ENUM('Pending','Approved','Rejected','Returned','Missing') DEFAULT 'Pending',
  `approved_by`      VARCHAR(100) DEFAULT NULL,
  `approved_date`    DATE         DEFAULT NULL,
  `condition_before` ENUM('Excellent','Good','Fair','Poor','Damaged') DEFAULT NULL,
  `condition_after`  ENUM('Excellent','Good','Fair','Poor','Damaged') DEFAULT NULL,
  `condition_notes`  TEXT         DEFAULT NULL,
  `metadata_json`    LONGTEXT     DEFAULT NULL,
  `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `wcc_transactions` (`id`,`student_id`,`student_name`,`student_course`,`student_contact`,`equipment_id`,`equipment_name`,`equipment_qrcode`,`request_date`,`due_date`,`status`,`approved_by`,`approved_date`) VALUES
('REQ001','2024-07-001234','TUGADE, MARK JOSEPH', 'BSIT 204','09123456789011','EQ002','LAN Cable Set',    'EQ002-QR-2024','2026-02-10','2026-02-17','Approved','System Administrator','2026-02-10'),
('REQ002','2024-07-002314','GO, JOHNRE MATTHEW',  'BSIT 204','0912323132321', 'EQ007','Cooking Tool Set', 'EQ007-QR-2024','2026-02-15','2026-02-20','Approved','System Administrator','2026-02-15'),
('REQ003','2024-07-004321','SAMSON, JOHN PATRICK','BSIT 204','09123231121',   'EQ008','Projector',        'EQ008-QR-2024','2026-02-12','2026-02-19','Approved','System Administrator','2026-02-12'),
('REQ004','2024-07-002431','YAP, JHASHZEL',       'BSIT 204','09123431231231','EQ001','Screwdriver Set',  'EQ001-QR-2024','2026-02-17','2026-02-24','Pending', NULL,                  NULL);

-- ============================================================
-- TABLE: wcc_transaction_logs  (Maintain Transaction Logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS `wcc_transaction_logs` (
  `log_id`         INT          AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` VARCHAR(20)  NOT NULL,
  `event`          VARCHAR(100) NOT NULL,
  `actor`          VARCHAR(150) NOT NULL,
  `event_date`     DATE         DEFAULT NULL,
  `detail`         TEXT         DEFAULT NULL,
  `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `wcc_transaction_logs` (`transaction_id`,`event`,`actor`,`event_date`,`detail`) VALUES
('REQ001','Request Submitted','TUGADE, MARK JOSEPH', '2026-02-10','Equipment: LAN Cable Set'),
('REQ001','Request Approved', 'System Administrator','2026-02-10','Approved for TUGADE, MARK JOSEPH'),
('REQ002','Request Submitted','GO, JOHNRE MATTHEW',  '2026-02-15','Equipment: Cooking Tool Set'),
('REQ002','Request Approved', 'System Administrator','2026-02-15','Approved for GO, JOHNRE MATTHEW'),
('REQ003','Request Submitted','SAMSON, JOHN PATRICK','2026-02-12','Equipment: Projector'),
('REQ003','Request Approved', 'System Administrator','2026-02-12','Approved for SAMSON, JOHN PATRICK'),
('REQ004','Request Submitted','YAP, JHASHZEL',       '2026-02-17','Equipment: Screwdriver Set');

-- ============================================================
-- TABLE: wcc_penalty_records  (Store Penalty Records)
-- ============================================================
CREATE TABLE IF NOT EXISTS `wcc_penalty_records` (
  `id`              INT          AUTO_INCREMENT PRIMARY KEY,
  `transaction_id`  VARCHAR(20)  NOT NULL,
  `student_id`      VARCHAR(50)  NOT NULL,
  `student_name`    VARCHAR(150) NOT NULL,
  `equipment_name`  VARCHAR(100) NOT NULL,
  `penalty_type`    VARCHAR(50)  NOT NULL,
  `amount`          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `overdue_hours`   INT          DEFAULT 0,
  `penalty_paid`    TINYINT(1)   DEFAULT 0,
  `payment_method`  VARCHAR(50)  DEFAULT NULL,
  `payment_date`    DATE         DEFAULT NULL,
  `return_date`     DATE         DEFAULT NULL,
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- No default penalty records (penalties are created at runtime when items are returned late)

-- ============================================================
-- End of WCC Equipment Borrowing and Tracking Return System
-- Database: wcc_equipment_system
-- Tables: wcc_users, wcc_equipment, wcc_transactions,
--         wcc_transaction_logs, wcc_penalty_records
-- ============================================================
