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
import { familySignup, lookupInmate } from '../src/apiClient';

const RELATIONS = ['Mother', 'Father', 'Wife', 'Husband', 'Brother', 'Sister', 'Other'];

const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [relation, setRelation] = useState('');
  const [inmateId, setInmateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [inmateNamePreview, setInmateNamePreview] = useState<string | null>(null);

  const validateEmail = (value: string) => /.+@.+\..+/.test(value);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword || !relation || !inmateId.trim()) {
      Alert.alert('Validation', 'Please fill all fields.');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Validation', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation', 'Password should be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }

    try {
      console.log('[Register] Starting registration', {
        name: name.trim(),
        email: email.trim(),
        relation,
        inmateId: inmateId.trim(),
      });

      setLoading(true);

      // Optional: try to show inmate name preview before creating account
      try {
        console.log('[Register] Looking up inmate', inmateId.trim());
        const inmate = await lookupInmate(inmateId.trim());
        console.log('[Register] Inmate lookup success', inmate);
        setInmateNamePreview(inmate.name);
      } catch (lookupError) {
        console.log('[Register] Inmate lookup failed', lookupError);
        // If lookup fails, familySignup will still return a clear error
        setInmateNamePreview(null);
      }

      console.log('[Register] Calling familySignup');
      const response = await familySignup({
        name: name.trim(),
        email: email.trim(),
        password,
        relation,
        inmateId: inmateId.trim(),
      });

      console.log('[Register] Signup success', response);

      // Do not auto-login after registration; send user to login screen
      Alert.alert('Success', 'Your account has been created. Please login.', [
        {
          text: 'OK',
          onPress: () => router.replace('/login'),
        },
      ]);
    } catch (error: any) {
      console.error('[Register] Error', error);
      Alert.alert('Registration', error?.message || 'Something went wrong while creating your account. Please try again.');
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
          <Text style={styles.heading}>Create Account</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
            />

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

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#6B7280"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Text style={styles.label}>Relation to inmate</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relationChipsRow}>
              {RELATIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.relationChip, relation === item && styles.relationChipActive]}
                  onPress={() => setRelation(item)}>
                  <Text
                    style={[
                      styles.relationChipText,
                      relation === item && styles.relationChipTextActive,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Inmate ID</Text>
            <TextInput
              style={styles.input}
              placeholder="FT-2213"
              placeholderTextColor="#6B7280"
              autoCapitalize="characters"
              value={inmateId}
              onChangeText={setInmateId}
            />

            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.8}
              onPress={handleRegister}
              disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Register'}</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Login</Text>
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
    paddingTop: 64,
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
  relationChipsRow: {
    paddingVertical: 4,
    gap: 8,
  },
  relationChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#111827',
    marginRight: 8,
  },
  relationChipActive: {
    backgroundColor: '#E63946',
  },
  relationChipText: {
    color: '#E5E7EB',
    fontSize: 13,
  },
  relationChipTextActive: {
    color: '#F9FAFB',
    fontWeight: '600',
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

export default RegisterScreen;
