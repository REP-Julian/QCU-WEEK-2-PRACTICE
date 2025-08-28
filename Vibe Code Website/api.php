<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$databaseFile = 'database.json';

function getDatabase() {
    global $databaseFile;
    if (!file_exists($databaseFile)) {
        $defaultData = ['users' => []];
        file_put_contents($databaseFile, json_encode($defaultData, JSON_PRETTY_PRINT));
        return $defaultData;
    }
    return json_decode(file_get_contents($databaseFile), true);
}

function saveDatabase($data) {
    global $databaseFile;
    file_put_contents($databaseFile, json_encode($data, JSON_PRETTY_PRINT));
}

function findUser($username) {
    $db = getDatabase();
    foreach ($db['users'] as $user) {
        if ($user['username'] === $username) {
            return $user;
        }
    }
    return null;
}

function createUser($username, $password, $email) {
    $db = getDatabase();
    
    // Check if user already exists
    if (findUser($username)) {
        return ['success' => false, 'message' => 'Username already exists'];
    }
    
    $newUser = [
        'id' => time(),
        'username' => $username,
        'password' => password_hash($password, PASSWORD_DEFAULT), // Proper password hashing
        'email' => $email,
        'createdAt' => date('c')
    ];
    
    $db['users'][] = $newUser;
    saveDatabase($db);
    
    return ['success' => true, 'message' => 'Account created successfully', 'user' => $newUser];
}

function validateLogin($username, $password) {
    $user = findUser($username);
    if ($user && password_verify($password, $user['password'])) {
        return ['success' => true, 'message' => 'Login successful', 'user' => $user];
    }
    return ['success' => false, 'message' => 'Invalid username or password'];
}

// Handle different request methods
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'POST':
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'register':
                    $username = $input['username'] ?? '';
                    $password = $input['password'] ?? '';
                    $email = $input['email'] ?? '';
                    
                    if (empty($username) || empty($password) || empty($email)) {
                        echo json_encode(['success' => false, 'message' => 'All fields are required']);
                        break;
                    }
                    
                    if (strlen($password) < 6) {
                        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
                        break;
                    }
                    
                    echo json_encode(createUser($username, $password, $email));
                    break;
                    
                case 'login':
                    $username = $input['username'] ?? '';
                    $password = $input['password'] ?? '';
                    
                    if (empty($username) || empty($password)) {
                        echo json_encode(['success' => false, 'message' => 'Username and password are required']);
                        break;
                    }
                    
                    echo json_encode(validateLogin($username, $password));
                    break;
                    
                default:
                    echo json_encode(['success' => false, 'message' => 'Invalid action']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'No action specified']);
        }
        break;
        
    case 'GET':
        // Get all users (for admin purposes - remove in production)
        $db = getDatabase();
        echo json_encode(['users' => count($db['users'])]);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
