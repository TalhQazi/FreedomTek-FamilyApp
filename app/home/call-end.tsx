import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function CallEndScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; duration?: string }>();
  const callId = params.id ?? '';
  const durationSeconds = Number(params.duration ?? '0') || 0;

  const formatTime = (total: number) => {
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const secs = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  const handleBack = async () => {
    try {
      if (callId) {
        const key = 'familyUsedCallIds';
        const existingRaw = await AsyncStorage.getItem(key);
        const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
        if (!existing.includes(callId)) {
          const next = [...existing, callId];
          await AsyncStorage.setItem(key, JSON.stringify(next));
        }
      }
    } catch {
      // ignore errors; call UI already completed
    }

    router.replace('/home/calls');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Call ended</Text>
        <Text style={styles.subtitle}>With inmate</Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryValue}>{formatTime(durationSeconds)}</Text>
          <Text style={styles.summaryNote}>Billing & monitoring will be added in future phases.</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleBack}>
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    width: '100%',
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  summaryValue: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryNote: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 32,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
