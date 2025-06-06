<?php
// Database configuration
$host = 'localhost';
$dbname = 'uni_app';
$username = 'root';
$password = '';

// Get task ID from the URL parameter
$taskId = isset($_GET['id']) ? intval($_GET['id']) : 0;
$status = isset($_GET['status']) ? $_GET['status'] : 'completed';

// Validate status
$validStatuses = ['pending', 'in progress', 'completed'];
if (!in_array($status, $validStatuses)) {
    $status = 'completed';
}

// Initialize response
$response = [
    'success' => false,
    'message' => ''
];

// Validate task ID
if ($taskId <= 0) {
    $response['message'] = 'Invalid task ID';
    echo json_encode($response);
    exit;
}

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Update the task status
    $stmt = $pdo->prepare("UPDATE tasks SET status = ? WHERE id = ?");
    $stmt->execute([$status, $taskId]);
    
    // Check if the task was updated
    if ($stmt->rowCount() > 0) {
        $response['success'] = true;
        $response['message'] = "Task $taskId has been marked as $status";
    } else {
        $response['message'] = "Task $taskId not found or no changes made";
    }
} catch (PDOException $e) {
    $response['message'] = "Database error: " . $e->getMessage();
}

// Return JSON response
header('Content-Type: application/json');
echo json_encode($response);
?>