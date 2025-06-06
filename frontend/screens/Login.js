import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import authUtils from '../utils/authUtils';
import { Ionicons } from '@expo/vector-icons';
import { IP, testServerConnection } from '../ip';

// Import reusable components
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import TextLink from '../components/TextLink';

const { width, height } = Dimensions.get('window');

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  
  const checkServerConnection = async () => {
    try {
      setConnectionStatus('checking');
      const result = await testServerConnection();
      
      if (result.success) {
        setConnectionStatus('connected');
        Alert.alert(
          'Connection Successful', 
          `Successfully connected to server at ${IP}:3000\n\nServer response: ${JSON.stringify(result.data)}`
        );
      } else {
        setConnectionStatus('failed');
        Alert.alert(
          'Connection Failed', 
          `Could not connect to server at ${IP}:3000\n\nError: ${result.error}\n\nPlease check:\n1. Server is running\n2. IP address is correct\n3. You're on the same network`
        );
      }
    } catch (error) {
      setConnectionStatus('failed');
      Alert.alert(
        'Connection Test Error', 
        `Error testing connection: ${error.message}`
      );
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      // Input validation with specific error messages
      if (!email && !password) {
        Alert.alert(
          'Missing Information', 
          'Please enter both your university email and password to continue.'
        );
        setLoading(false);
        return;
      }
      
      if (!email) {
        Alert.alert(
          'Email Required', 
          'Please enter your university email address.'
        );
        setLoading(false);
        return;
      }
      
      if (!password) {
        Alert.alert(
          'Password Required', 
          'Please enter your password to continue.'
        );
        setLoading(false);
        return;
      }
      
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert(
          'Invalid Email Format', 
          'Please enter a valid email address (e.g., student@university.edu).'
        );
        setLoading(false);
        return;
      }

      const roles = ['student', 'faculty', 'admin'];
      let loginSuccess = false;
      let lastError = null;

      for (const role of roles) {
        try {
          const response = await apiService.login(email, password, role);

          if (response.data.token) {
            // Store authentication data
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('userRole', role);
            
            // Store login timestamp for token expiration handling
            await AsyncStorage.setItem('loginTime', Date.now().toString());

            // Navigate to appropriate dashboard
            navigation.replace(
              role === 'student'
                ? 'StudentDashboard'
                : role === 'faculty'
                ? 'FacultyDashboard'
                : 'AdminDashboard'
            );

            loginSuccess = true;
            break;
          }
        } catch (error) {
          lastError = error;
          continue;
        }
      }

      if (!loginSuccess) {
        // Check for specific error conditions
        if (lastError?.response?.status === 401) {
          Alert.alert(
            'Authentication Failed', 
            'Invalid credentials. Please check your email and password and try again.'
          );
        } else if (lastError?.response?.status === 403) {
          Alert.alert(
            'Account Locked', 
            'Your account has been temporarily locked due to multiple failed login attempts. Please contact the IT helpdesk.'
          );
        } else if (lastError?.response?.status === 404) {
          Alert.alert(
            'Account Not Found', 
            'No account found with this email address. Please check your email or register for a new account.'
          );
        } else {
          Alert.alert(
            'Authentication Failed', 
            'Unable to authenticate. Please check your credentials or contact the IT helpdesk for assistance.'
          );
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Enhanced network error handling
      if (error.message && (
          error.message.includes('Network Error') || 
          error.message.includes('connect') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('timeout')
      )) {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to the university portal. Please check that:\n\n' +
          '1. The server is running\n' +
          '2. Your device is connected to the same network as the server\n' +
          '3. The server IP address (192.168.0.68) is correct\n\n' +
          'Technical details: ' + error.message
        );
      } else if (error.response) {
        // Server returned an error response
        Alert.alert(
          'Server Error', 
          `Error code: ${error.response.status}. Please try again later or contact support.`
        );
      } else {
        // Generic error handling
        Alert.alert(
          'Login Error', 
          'An unexpected error occurred. Please try again later or contact the IT helpdesk.\n\n' +
          'Technical details: ' + (error.message || 'Unknown error')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" />
      {/* Set the title for the screen - visible in some contexts */}
      <Text style={{ height: 0, width: 0, opacity: 0 }}>Campus Connect - University Portal</Text>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo and Header Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>UNI</Text>
            </View>
            <Text style={styles.appName}>Campus Connect</Text>
            <Text style={styles.appTagline}>Your Complete University Portal</Text>
          </View>

          {/* Login Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome to Campus Connect</Text>
            <Text style={styles.subtitle}>Access your academic portal</Text>

            <FormInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="University email address"
              iconName="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              accessibilityLabel="Email input field"
              accessibilityHint="Enter your university email address"
              textContentType="emailAddress"
              autoCompleteType="email"
            />

            <FormInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your secure password"
              iconName="lock-closed-outline"
              secureTextEntry={true}
              isSecureTextVisible={isPasswordVisible}
              onToggleSecureEntry={() => setIsPasswordVisible(!isPasswordVisible)}
              editable={!loading}
              accessibilityLabel="Password input field"
              accessibilityHint="Enter your secure password"
              textContentType="password"
              autoCompleteType="password"
            />

            <TextLink
              text="Reset University Password"
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
              accessibilityLabel="Reset University Password"
              accessibilityHint="Navigate to password reset screen"
              style={styles.forgotPassword}
            />

            <PrimaryButton
              title="Access Portal"
              onPress={handleLogin}
              isLoading={loading}
              iconName="arrow-forward"
              accessibilityLabel="Access Portal"
              accessibilityHint="Log in to your university account"
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>NEW USER?</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.register}>
              <Text style={styles.registerText}>First time accessing the portal? </Text>
              <TextLink
                text="Register Here"
                onPress={() => navigation.navigate('Registration')}
                disabled={loading}
                accessibilityLabel="Register Here"
                accessibilityHint="Navigate to registration screen"
              />
            </View>
            
            {/* Connection test button */}
{/* 
<TouchableOpacity 
  style={styles.connectionTestButton} 
  onPress={checkServerConnection}
  disabled={loading || connectionStatus === 'checking'}
>
  <Text style={styles.connectionTestText}>
    {connectionStatus === 'checking' ? 'Testing Connection...' : 
     connectionStatus === 'connected' ? 'Connection OK ✓' : 
     connectionStatus === 'failed' ? 'Connection Failed ✗' : 
     'Test Server Connection'}
  </Text>
  <Text style={styles.serverInfo}>Server: {IP}:3000</Text>
</TouchableOpacity>
*/}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0ea5e9', // Bright blue background
    paddingTop: Constants.statusBarHeight,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    marginTop: 10,
    flex: 1,
    minHeight: height * 0.65, // Ensure form takes at least 65% of screen height
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#334155', // Darker color for better visibility (changed from #64748b)
    marginBottom: 24,
    fontWeight: '500', // Added font weight for better readability
  },
  // These styles are now handled by the reusable components
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#334155', // Darker color for better visibility (changed from #64748b)
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600', // Added font weight for better readability
  },
  register: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8, // Add padding for better touch target
  },
  registerText: {
    color: '#334155', // Darker color for better visibility (changed from #64748b)
    fontSize: 14,
    fontWeight: '500', // Added font weight for better readability
  },
  connectionTestButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  connectionTestText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  serverInfo: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
});

export default Login;
