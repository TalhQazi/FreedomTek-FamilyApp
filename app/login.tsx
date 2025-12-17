import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
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
import { familyLogin } from '../src/apiClient';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation', 'Please enter both email and password.');
      return;
    }

    try {
      console.log('[Login] Starting login', { email: email.trim() });
      setLoading(true);
      const response = await familyLogin({
        email: email.trim(),
        password,
      });

      console.log('[Login] Login success', response);

      await AsyncStorage.setItem('familyAccessToken', response.accessToken);
      await AsyncStorage.setItem('familyRefreshToken', response.refreshToken || '');
      await AsyncStorage.setItem('familyCurrentUser', JSON.stringify(response.user));
      await AsyncStorage.setItem('loggedIn', 'true');

      router.replace('/home' as never);
    } catch (error: any) {
      console.error('[Login] Error', error);
      Alert.alert('Login failed', error?.message || 'Something went wrong while logging in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.logo}>FreedomTek</Text>
          <Text style={styles.heading}>Welcome back</Text>

          <View style={styles.form}>
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

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#6B7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleLogin} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Logging in…' : 'Login'}</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Register</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
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
    marginBottom: 32,
  },
  form: {
    gap: 12,
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
  footerRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
  },
  footerLink: {
    color: '#E63946',
    fontWeight: '600',
  },
});

export default LoginScreen;
