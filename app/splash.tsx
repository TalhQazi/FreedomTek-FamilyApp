import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const SplashScreen: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/language');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>FreedomTek</Text>
      <Text style={styles.subtitle}>Family App</Text>
      <ActivityIndicator style={styles.loader} size="small" color="#E5E7EB" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1F25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#E63946',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#E5E7EB',
  },
  loader: {
    marginTop: 24,
  },
});

export default SplashScreen;
