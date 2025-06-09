// Default IP address - can be overridden during build or runtime
let serverIP = '192.168.29.145';

// Check if running in development environment with Expo
if (__DEV__) {
  // You can set a different IP for development if needed
  // For example, using localhost for web or your machine's IP for device testing
  //console.log('Running in development mode');
  
  // For local development, you might want to use localhost or your machine's actual IP
  // Uncomment and modify one of these lines if needed:
  // serverIP = 'localhost'; // For web testing
  // serverIP = '127.0.0.1'; // Alternative localhost
  // serverIP = '10.0.2.2';  // For Android emulator connecting to host machine
}

// Allow for runtime configuration (useful for different environments)
if (process.env.REACT_NATIVE_SERVER_IP) {
  serverIP = process.env.REACT_NATIVE_SERVER_IP;
}

export const IP = serverIP;
//console.log(`App connecting to server at: ${IP}`);

// Add a function to test the connection to the server
export const testServerConnection = async () => {
  try {
    const response = await fetch(`http://${IP}:3000/api/test`);
    const data = await response.json();
    //console.log('Server connection test result:', data);
    return { success: true, data };
  } catch (error) {
    //console.error('Server connection test failed:', error.message);
    return { success: false, error: error.message };
  }
};