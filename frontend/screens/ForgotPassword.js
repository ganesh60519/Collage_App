import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      if (!email) {
        Alert.alert('Missing Information', 'Please enter your university email to continue.');
        setLoading(false);
        return;
      }

      // This is a placeholder - in a real app, you would connect to your backend
      // to initiate the password reset process
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Password Reset Initiated',
          'If your email is registered in our system, you will receive password reset instructions shortly.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }, 1500);
    } catch (error) {
      //console.error('Password reset error:', error);
      Alert.alert('Connection Error', 'Unable to connect to the university portal. Please check your internet connection and try again later.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Text style={{ height: 0, width: 0, opacity: 0 }}>Mahatma Gandhi University Password Reset</Text>
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
            <Text style={styles.welcomeText}>Reset Your Password</Text>
            <Text style={styles.subtitle}>Enter your university email to receive reset instructions</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>University Email</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email (e.g., name@mguniversity.edu)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Send Reset Instructions</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.returnToLogin}>
              <Text style={styles.returnText}>Back to </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
              >
                <Text style={styles.linkText}>Sign In</Text>
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
    paddingVertical: 30,
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
  button: {
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
  returnToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  returnText: {
    fontSize: 14,
    color: '#475569',
  },
  linkText: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: '600',
  },
});

export default ForgotPassword;