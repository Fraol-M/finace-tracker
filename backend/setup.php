<?php
/**
 * One-time setup script: creates database, tables, and seeds initial data.
 * Run with: C:\xampp\php\php.exe backend/setup.php
 */

echo "=== FinPrecision Database Setup ===\n\n";

$host = 'localhost';
$port = 3306;
$username = 'root';
$password = '';

try {
    // 1. Connect without database to create it
    $pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS finprecision CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "[OK] Database 'finprecision' created/verified.\n";

    $pdo->exec("USE finprecision");

    // 2. Create tables
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(50) PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            full_name VARCHAR(200) NOT NULL,
            email VARCHAR(200) NOT NULL UNIQUE,
            phone VARCHAR(50) DEFAULT '-',
            role ENUM('admin','user') DEFAULT 'user',
            password_hash VARCHAR(255) NOT NULL,
            is_unverified TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    echo "[OK] Table 'users' created/verified.\n";

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(50) NOT NULL,
            title VARCHAR(200) NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            category VARCHAR(100) NOT NULL,
            date DATE NOT NULL,
            type ENUM('income','expense') NOT NULL,
            icon VARCHAR(50) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    echo "[OK] Table 'transactions' created/verified.\n";

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS auth_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    echo "[OK] Table 'auth_tokens' created/verified.\n";

    // 3. Seed users (skip if already exist)
    $checkUser = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

    if ((int)$checkUser === 0) {
        echo "\n--- Seeding users ---\n";

        $users = [
            ['u1', 'astral_fox', 'Eleanor Vance', 'eleanor.v@gmail.com', '+1 (555) 019-2834', 'user', 'Password123!', 0],
            ['u2', 'cipher_node', 'Marcus Sterling', 'm.sterling.dev@gmail.com', '+1 (555) 837-9921', 'user', 'Password123!', 0],
            ['u3', 'nova_pulse', 'Sarah Jenkins', 's.jenkins88@gmail.com', '+44 7700 900077', 'user', 'Password123!', 0],
            ['u4', 'echo_base', 'Unverified User', 'echo.b@gmail.com', '-', 'user', 'Password123!', 1],
            ['admin', 'admin', 'FinPrecision Admin', 'admin@finprecision.com', '+1 (555) 555-0100', 'admin', 'admin', 0],
            ['kaleb', 'kaleb', 'Kaleb Seyoum', 'kalebseyoum1234@gmail.com', '+1 (555) 777-2023', 'user', 'user', 0],
        ];

        $stmt = $pdo->prepare("
            INSERT INTO users (id, username, full_name, email, phone, role, password_hash, is_unverified)
            VALUES (:id, :username, :full_name, :email, :phone, :role, :password_hash, :is_unverified)
        ");

        foreach ($users as $u) {
            $stmt->execute([
                ':id'            => $u[0],
                ':username'      => $u[1],
                ':full_name'     => $u[2],
                ':email'         => $u[3],
                ':phone'         => $u[4],
                ':role'          => $u[5],
                ':password_hash' => password_hash($u[6], PASSWORD_BCRYPT),
                ':is_unverified' => $u[7],
            ]);
            echo "  [+] User '{$u[1]}' seeded.\n";
        }
    } else {
        echo "\n[SKIP] Users table already has data ($checkUser rows).\n";
    }

    // 4. Seed transactions for 'kaleb' user
    $checkTx = $pdo->query("SELECT COUNT(*) FROM transactions")->fetchColumn();

    if ((int)$checkTx === 0) {
        echo "\n--- Seeding transactions ---\n";

        // Use current month prefix
        $prefix = date('Y-m');

        $transactions = [
            ['kaleb', 'AWS Cloud Services', -450.00, 'Infrastructure', "{$prefix}-24", 'expense', 'computer'],
            ['kaleb', 'Client Dinner', -125.50, 'Meals', "{$prefix}-22", 'expense', 'restaurant'],
            ['kaleb', 'Delta Airlines Flight', -890.00, 'Travel', "{$prefix}-18", 'expense', 'flight'],
            ['kaleb', 'Adobe Creative Cloud', -54.99, 'Software', "{$prefix}-15", 'expense', 'subscriptions'],
            ['kaleb', 'Freelance Design Project', 2400.00, 'Consulting', "{$prefix}-12", 'expense', 'payments'],
            ['kaleb', 'Monthly Salary', 6500.00, 'Salary', "{$prefix}-01", 'income', 'account_balance'],
            ['kaleb', 'Acme Corp Dividend', 4500.00, 'Investments', "{$prefix}-24", 'income', 'payments'],
            ['kaleb', 'AWS Cloud Hosting', -1240.50, 'Infrastructure', "{$prefix}-22", 'expense', 'computer'],
            ['kaleb', 'Q3 Marketing Retainer', -8500.00, 'Marketing', "{$prefix}-18", 'expense', 'campaign'],
            ['kaleb', 'Client Payment - Project X', 24000.00, 'Revenue', "{$prefix}-15", 'income', 'payments'],
            ['kaleb', 'Office Supplies', -342.12, 'Operations', "{$prefix}-12", 'expense', 'description'],
        ];

        $stmt = $pdo->prepare("
            INSERT INTO transactions (uid, title, amount, category, date, type, icon)
            VALUES (:uid, :title, :amount, :category, :date, :type, :icon)
        ");

        foreach ($transactions as $t) {
            $stmt->execute([
                ':uid'      => $t[0],
                ':title'    => $t[1],
                ':amount'   => $t[2],
                ':category' => $t[3],
                ':date'     => $t[4],
                ':type'     => $t[5],
                ':icon'     => $t[6],
            ]);
            echo "  [+] Transaction '{$t[1]}' seeded.\n";
        }
    } else {
        echo "\n[SKIP] Transactions table already has data ($checkTx rows).\n";
    }

    echo "\n=== Setup complete! ===\n";
    echo "Start the PHP server with:\n";
    echo "  C:\\xampp\\php\\php.exe -S localhost:8000 backend/router.php\n\n";

} catch (PDOException $e) {
    echo "[ERROR] " . $e->getMessage() . "\n";
    exit(1);
}
