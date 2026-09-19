
  # Equipment Borrowing and Tracking Return System

  This project uses a React frontend and a PHP/PDO API under `api/index.php`. User accounts, profile photos, equipment stock, requests, returns, payment records, and audit logs are persisted in MySQL.

  ## Running the code

  ## Local setup (XAMPP)

  1. Start Apache and MySQL in XAMPP.
  2. Import `database/wcc_equipment_system.sql` in phpMyAdmin. The API also creates missing tables automatically.
  3. From this folder run `npm install`, then `npm run dev`.
  4. Open the Vite URL shown in the terminal. The frontend calls `http://localhost/EBTS/api/index.php`.

  The API expects the default XAMPP MySQL connection (`root` with an empty password). Change the constants at the top of `api/index.php` if your MySQL credentials differ.

  ## Production build

  Run `npm run build` to create the production bundle in `dist/`.
  