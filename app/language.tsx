import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  
];

const LanguageScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSelect = async (code: string) => {
    try {
      setLoading(true);
      await AsyncStorage.setItem('language', code);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Could not save language selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.logo}>FreedomTek</Text>
      </View>

      <Text style={styles.title}>Choose your language</Text>
      <Text style={styles.subtitle}>Select a language to continue using the app.</Text>

      <View style={styles.buttonsContainer}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.button}
            activeOpacity={0.8}
            onPress={() => !loading && handleSelect(lang.code)}>
            <Text style={styles.buttonText}>{lang.label}</Text>
          </TouchableOpacity>
        ))}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#E5E7EB" />
            <Text style={styles.loadingText}>Saving language…</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1F25',
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E63946',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E5E7EB',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  buttonsContainer: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  buttonText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
});

export default LanguageScreen;
