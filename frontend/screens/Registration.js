import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import { IP } from '../ip';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const Registration = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [branch, setBranch] = useState('CSE');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const branches = [
    { label: 'Computer Science & Engineering', value: 'CSE' },
    { label: 'Information Science & Engineering', value: 'ISE' },
    { label: 'Electronics & Communication Engineering', value: 'ECE' },
    { label: 'Civil Engineering', value: 'CIVIL' },
    { label: 'Mechanical Engineering', value: 'MECH' },
    { label: 'Electrical Engineering', value: 'EEE' },
    { label: 'Biotechnology', value: 'BT' },
  ];

  const handleRegister = async () => {
    try {
      setIsLoading(true);
      if (!name || !email || !password) {
        Alert.alert('Registration Incomplete', 'Please complete all required fields to proceed with university registration.');
        setIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Invalid Email Format', 'Please enter a valid university email address (e.g., name@university.edu).');
        setIsLoading(false);
        return;
      }

      const endpoint =
        role === 'admin'
          ? 'admin/register'
          : role === 'faculty'
          ? 'faculty/register'
          : 'student/register';

      const response = await axios.post(`http://${IP}:3000/api/${endpoint}`, {
        name,
        email,
        password,
        branch: role === 'admin' ? null : branch,
      });

      if (response.data.success) {
        Alert.alert('Registration Successful', 'Your university account has been created. You can now log in to access your academic portal.', [
          { text: 'Proceed to Login', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage =
        error.response?.data?.error || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', `Unable to complete university registration: ${errorMessage}. Please contact the university IT support if this issue persists.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22c55e" />
      {/* Set the title for the screen - visible in some contexts */}
      <Text style={{ height: 0, width: 0, opacity: 0 }}>Campus Connect - University Registration</Text>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>University Registration</Text>
              <Text style={styles.headerSubtitle}>Access your academic resources</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your legal full name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your.name@university.edu"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a secure password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  placeholderTextColor="#94a3b8"
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.visibilityToggle}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#64748b" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>University Role</Text>
              <View style={styles.pickerWithIcon}>
                <Ionicons name="school-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={role}
                    style={styles.picker}
                    onValueChange={(itemValue) => {
                      setRole(itemValue);
                      if (itemValue === 'admin') {
                        setBranch('');
                      } else {
                        setBranch('CSE');
                      }
                    }}
                    enabled={!isLoading}
                  >
                    <Picker.Item label="Student" value="student" />
                    <Picker.Item label="Faculty Member" value="faculty" />
                    <Picker.Item label="Administrative Staff" value="admin" />
                  </Picker>
                </View>
              </View>
            </View>

            {role !== 'admin' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Academic Department</Text>
                <View style={styles.pickerWithIcon}>
                  <Ionicons name="git-branch-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={branch}
                      style={styles.picker}
                      onValueChange={(itemValue) => setBranch(itemValue)}
                      enabled={!isLoading}
                    >
                      {branches.map((b) => (
                        <Picker.Item key={b.value} label={b.label} value={b.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Register for Access</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>EXISTING USER?</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.loginRedirectContainer}>
              <Text style={styles.loginRedirectText}>Already registered with the university? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
              >
                <Text style={styles.loginLink}>Login Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22c55e', // Green background
    paddingTop: Constants.statusBarHeight,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
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
    flex: 1,
    minHeight: height * 0.65, // Ensure form takes at least 65% of screen height
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    height: Platform.OS === 'ios' ? 50 : 56,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#0f172a',
    paddingVertical: 0, // Remove vertical padding to fix alignment
  },
  visibilityToggle: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
  },
  pickerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    height: Platform.OS === 'ios' ? 50 : 56,
  },
  pickerWrapper: {
    flex: 1,
    height: '100%',
  },
  picker: {
    height: Platform.OS === 'android' ? 56 : 150,
    width: '100%',
    color: '#0f172a',
  },
  registerButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#86efac',
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#64748b',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  loginRedirectContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8, // Add padding for better touch target
  },
  loginRedirectText: {
    color: '#64748b',
    fontSize: 14,
  },
  loginLink: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Registration;