import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { familyForgotPassword, familyResetPassword } from '../src/apiClient';

const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Validation', 'Please enter your email.');
      return;
    }

    try {
      setLoading(true);
      await familyForgotPassword(trimmedEmail.toLowerCase());
      Alert.alert(
        'Check your email',
        'If an account with this email exists, a reset code has been sent.',
      );
      setStep('reset');
    } catch (error: any) {
      console.error('[ForgotPassword] request error', error);
      Alert.alert('Error', error?.message || 'Failed to request reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !code.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Validation', 'Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Validation', 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await familyResetPassword({
        email: trimmedEmail.toLowerCase(),
        code: code.trim(),
        newPassword,
      });

      Alert.alert('Success', 'Your password has been reset. Please log in with your new password.', [
        {
          text: 'OK',
          onPress: () => router.replace('/login' as never),
        },
      ]);
    } catch (error: any) {
      console.error('[ForgotPassword] reset error', error);
      Alert.alert('Error', error?.message || 'Failed to reset password. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.logo}>FreedomTek</Text>
          <Text style={styles.heading}>Forgot Password</Text>

          {step === 'request' ? (
            <View style={styles.form}>
              <Text style={styles.description}>
                Enter your email and we will send you a code to reset your password.
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={handleRequestCode}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Sending code…' : 'Send reset code'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.description}>
                Enter the code sent to your email and choose a new password.
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Reset code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter code"
                placeholderTextColor="#6B7280"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />

              <Text style={styles.label}>New password</Text>
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor="#6B7280"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Text style={styles.label}>Confirm new password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#6B7280"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Resetting…' : 'Reset password'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.replace('/login' as never)}
          >
            <Text style={styles.backText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#1E1F25',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#1E1F25',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E63946',
    textAlign: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 12,
  },
  description: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  input: {
    height: 52,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#2A2B31',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  backRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  backText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;
