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
        Alert.alert('Invalid Email Format', 'Please enter a valid university email address (e.g., name@mguniversity.edu).');
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Text style={{ height: 0, width: 0, opacity: 0 }}>Mahatma Gandhi University Registration</Text>
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
            <View style={styles.logoContainer}>
              <Ionicons name="school-outline" size={50} color="#1e3a8a" />
              <Text style={styles.logoText}>MGU</Text>
            </View>
            <Text style={styles.universityName}>Mahatma Gandhi University</Text>
            <Text style={styles.tagline}>Empowering Education</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Create Your Account</Text>
            <Text style={styles.subtitle}>Join the MGU academic portal</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>University Email</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
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
                  <Text style={styles.buttonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.loginRedirectContainer}>
              <Text style={styles.loginRedirectText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
              >
                <Text style={styles.loginLink}>Sign In</Text>
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
    backgroundColor: '#f8fafc', // Light neutral background
    paddingTop: Constants.statusBarHeight,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingإأpaddingVertical: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 50,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1e3a8a',
    paddingVertical: 0,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 50,
  },
  pickerWrapper: {
    flex: 1,
    height: '100%',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#1e3a8a',
  },
  registerButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#64748b',
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
  loginRedirectContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginRedirectText: {
    fontSize: 14,
    color: '#475569',
  },
  loginLink: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: '600',
  },
});

export default Registration;