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
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert(
          'Invalid Email Format', 
          'Please enter a valid email address (e.g., student@mguniversity.edu).'
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
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('userRole', role);
            await AsyncStorage.setItem('loginTime', Date.now().toString());

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
        Alert.alert(
          'Server Error', 
          `Error code: ${error.response.status}. Please try again later or contact support.`
        );
      } else {
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Text style={{ height: 0, width: 0, opacity: 0 }}>Mahatma Gandhi University Portal</Text>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Ionicons name="school-outline" size={50} color="#1e3a8a" />
              <Text style={styles.logoText}>MGU</Text>
            </View>
            <Text style={styles.universityName}>Mahatma Gandhi University</Text>
            <Text style={styles.tagline}>Empowering Education</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your university portal</Text>

            <FormInput
              label="University Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email "
              iconName="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              accessibilityLabel="University email input field"
              accessibilityHint="Enter your Mahatma Gandhi University email address"
              textContentType="emailAddress"
              autoCompleteType="email"
              style={styles.input}
            />

            <FormInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              iconName="lock-closed-outline"
              secureTextEntry={true}
              isSecureTextVisible={isPasswordVisible}
              onToggleSecureEntry={() => setIsPasswordVisible(!isPasswordVisible)}
              editable={!loading}
              accessibilityLabel="Password input field"
              accessibilityHint="Enter your secure password"
              textContentType="password"
              autoCompleteType="password"
              style={styles.input}
            />

            <TextLink
              text="Forgot Password?"
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
              accessibilityLabel="Forgot Password"
              accessibilityHint="Navigate to password reset screen"
              style={styles.forgotPassword}
            />

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              isLoading={loading}
              iconName="arrow-forward"
              accessibilityLabel="Sign In"
              accessibilityHint="Log in to your Mahatma Gandhi University account"
              style={styles.signInButton}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>New to MGU Portal? </Text>
              <TextLink
                text="Create Account"
                onPress={() => navigation.navigate('Registration')}
                disabled={loading}
                accessibilityLabel="Create Account"
                accessibilityHint="Navigate to registration screen"
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.connectionTestButton,
                connectionStatus === 'connected' && styles.connectedButton,
                connectionStatus === 'failed' && styles.failedButton
              ]} 
              onPress={checkServerConnection}
              disabled={loading || connectionStatus === 'checking'}
            >
              <Text style={styles.connectionTestText}>
                {connectionStatus === 'checking' ? 'Checking Connection...' : 
                 connectionStatus === 'connected' ? 'Connected ✓' : 
                 connectionStatus === 'failed' ? 'Connection Failed ✗' : 
                 'Test Connection'}
              </Text>
              <Text style={styles.serverInfo}>Server: {IP}:3000</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Light neutral background
    paddingTop: Constants.statusBarHeight,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 50,
    padding: 12,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e3a8a',
    marginLeft: 8,
  },
  universityName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#475569',
    marginTop: 4,
  },
  formContainer: {
    width: width * 0.9,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  signInButton: {
    marginTop: 8,
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingVertical: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
    color: '#475569',
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
  connectedButton: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  failedButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  connectionTestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  serverInfo: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});

export default Login;