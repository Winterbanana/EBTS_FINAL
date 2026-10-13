
  # Equipment Borrowing and Tracking Return System

  This project uses a React frontend and a PHP/PDO API under `api/index.php`. User accounts, profile photos, equipment stock, requests, returns, payment records, and audit logs are persisted in MySQL. Changes are saved to MySQL automatically after the app state changes; the app also keeps a browser-local cache, but that cache is not a substitute for a database backup.

  The September 2026 inventory contains Culinary, Hospitality, Aviation Maintenance, and Science/Health-related equipment. Each catalog item has a brand, program, stable equipment image, QR code, and an initial stock quantity of one. The API creates missing database tables but does not replace an existing database during startup.

  Late-return penalties are ₱100 per calendar day after the due date. Cash, GCash, and Maya selections are recorded as pending until staff/admin verifies receipt; external payment gateway charging is not configured in this local system.

  ## Running the code

  ## Local setup (XAMPP)

  1. Start Apache and MySQL in XAMPP.
  2. For a new database, start the app once so the API creates the required empty tables, then register/configure accounts and inventory. To transfer an existing database, restore a full SQL backup using the steps below instead of using starter/mock data.
  3. From this folder run `npm install`, then `npm run dev`.
  4. Open the Vite URL shown in the terminal. The frontend calls `http://localhost/EBTS/api/index.php`.

  The API expects the default XAMPP MySQL connection (`root` with an empty password). Change the constants at the top of `api/index.php` if your MySQL credentials differ.

  ## Save and transfer the database

  MySQL is the durable source of truth. Every app-state change is sent to the API and saved in MySQL; save failures appear in the app's database error message. The API compresses its full-state snapshot before storing it, so large saves fit common XAMPP MySQL packet limits; it can still read snapshots saved in the older uncompressed format. Browser local storage is only a local cache and does not move to another device.

  Create a complete backup on the current device while XAMPP MySQL is running. Store it outside the repository because it contains student personal information and account credentials:

  ```powershell
  .\database\backup_database.ps1 -OutputPath 'E:\EBTS-Backups\wcc_equipment_system_20261014.sql'
  ```

  Copy that `.sql` file to the other device using a private, encrypted drive or transfer method. Start MySQL on the destination device and restore the backup into its EBTS database:

  ```powershell
  & $env:ComSpec /c '""C:\xampp\mysql\bin\mysql.exe" --host=127.0.0.1 --user=root < "E:\EBTS-Backups\wcc_equipment_system_20261014.sql""'
  ```

  The dump includes the database schema and all rows, including the saved app-state snapshot, account records, equipment, transactions, penalties, and logs. Restoring a full dump replaces same-named tables in the target database; back up any target database first and restore only when replacement is intended. After restoring, configure `api/index.php` with the destination MySQL credentials, start Apache/MySQL, and open the app. Do not rely on `localStorage` or the app's initial mock data to transfer records.

  Password protection note: this local application currently compares the stored password value directly during login, so the SQL backup contains password values along with student personal data. Keep backup files private, protect the transfer medium, and do not commit backups to Git or send them through public links.

  System rule: each student may have a maximum of 3 active borrowed items at any time. Borrowing approvals are blocked when a student reaches the limit, and the limit is enforced both in the UI and in the PHP state-save API.

  ## Production build

  Run `npm run build` to create the production bundle in `dist/`.
  