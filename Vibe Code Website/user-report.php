<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$databaseFile = 'database.json';

function getDatabase() {
    global $databaseFile;
    if (!file_exists($databaseFile)) {
        return ['users' => []];
    }
    return json_decode(file_get_contents($databaseFile), true);
}

function generateUserReport() {
    $db = getDatabase();
    $users = $db['users'] ?? [];
    
    $report = [
        'timestamp' => date('c'),
        'total_users' => count($users),
        'statistics' => [
            'users_created_today' => 0,
            'users_created_this_week' => 0,
            'users_created_this_month' => 0,
            'average_username_length' => 0,
            'domains' => []
        ],
        'users' => []
    ];
    
    $today = date('Y-m-d');
    $weekStart = date('Y-m-d', strtotime('-7 days'));
    $monthStart = date('Y-m-d', strtotime('-30 days'));
    $usernameLengths = [];
    $domains = [];
    
    foreach ($users as $user) {
        $createdDate = date('Y-m-d', strtotime($user['createdAt']));
        
        // Count users by date ranges
        if ($createdDate === $today) {
            $report['statistics']['users_created_today']++;
        }
        if ($createdDate >= $weekStart) {
            $report['statistics']['users_created_this_week']++;
        }
        if ($createdDate >= $monthStart) {
            $report['statistics']['users_created_this_month']++;
        }
        
        // Calculate username lengths
        $usernameLengths[] = strlen($user['username']);
        
        // Extract email domains
        if (isset($user['email']) && strpos($user['email'], '@') !== false) {
            $domain = explode('@', $user['email'])[1];
            $domains[$domain] = ($domains[$domain] ?? 0) + 1;
        }
        
        // Add user info (without password for security)
        $report['users'][] = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'] ?? 'N/A',
            'created_at' => $user['createdAt'],
            'days_since_creation' => floor((time() - strtotime($user['createdAt'])) / 86400),
            'has_password' => !empty($user['password'])
        ];
    }
    
    // Calculate average username length
    if (!empty($usernameLengths)) {
        $report['statistics']['average_username_length'] = round(array_sum($usernameLengths) / count($usernameLengths), 2);
    }
    
    // Sort domains by frequency
    arsort($domains);
    $report['statistics']['domains'] = array_slice($domains, 0, 10); // Top 10 domains
    
    return $report;
}

function exportUsersToCSV() {
    $db = getDatabase();
    $users = $db['users'] ?? [];
    
    $csvData = "ID,Username,Email,Created At,Days Since Creation\n";
    
    foreach ($users as $user) {
        $daysSince = floor((time() - strtotime($user['createdAt'])) / 86400);
        $csvData .= sprintf(
            "%s,%s,%s,%s,%s\n",
            $user['id'],
            $user['username'],
            $user['email'] ?? 'N/A',
            $user['createdAt'],
            $daysSince
        );
    }
    
    return $csvData;
}

// Handle different request types
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'report';

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'report':
                echo json_encode(generateUserReport(), JSON_PRETTY_PRINT);
                break;
                
            case 'csv':
                header('Content-Type: text/csv');
                header('Content-Disposition: attachment; filename="users_' . date('Y-m-d') . '.csv"');
                echo exportUsersToCSV();
                break;
                
            case 'count':
                $db = getDatabase();
                echo json_encode(['total_users' => count($db['users'] ?? [])]);
                break;
                
            case 'latest':
                $db = getDatabase();
                $users = $db['users'] ?? [];
                $latest = array_slice(array_reverse($users), 0, 5); // Last 5 users
                echo json_encode(['latest_users' => $latest], JSON_PRETTY_PRINT);
                break;
                
            default:
                echo json_encode(['error' => 'Invalid action. Available: report, csv, count, latest']);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['action']) && $input['action'] === 'search') {
            $searchTerm = strtolower($input['term'] ?? '');
            $db = getDatabase();
            $users = $db['users'] ?? [];
            
            $results = array_filter($users, function($user) use ($searchTerm) {
                return strpos(strtolower($user['username']), $searchTerm) !== false ||
                       strpos(strtolower($user['email'] ?? ''), $searchTerm) !== false;
            });
            
            echo json_encode(['results' => array_values($results)], JSON_PRETTY_PRINT);
        } else {
            echo json_encode(['error' => 'Invalid POST request']);
        }
        break;
        
    default:
        echo json_encode(['error' => 'Method not allowed']);
}
?>
