import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../src/apiClient';

export default function IncomingCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; fromLabel?: string }>();
  const callId = params.id ?? '';
  const fromLabel = params.fromLabel ?? 'Inmate';

  const handleReject = () => {
    router.back();
  };

  const handleAccept = async () => {
    try {
      if (!callId) {
        Alert.alert('Error', 'Call information is missing. Please try again.');
        return;
      }

      const token = await AsyncStorage.getItem('familyAccessToken');
      if (!token) {
        Alert.alert('Session expired', 'Please log in again to join the call.');
        router.replace('/login');
        return;
      }

      const res = await fetch(`${BASE_URL}/calls/${callId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let message = 'Failed to join call.';
        try {
          const body = await res.text();
          if (body && !body.startsWith('<')) {
            const parsed = JSON.parse(body);
            if (parsed && parsed.error) {
              message = parsed.error;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      const data = await res.json();

      router.replace({
        pathname: '/home/call-active',
        params: {
          id: String(data.callId),
          roomUrl: data.roomUrl,
          token: data.token,
        },
      });
    } catch (err: any) {
      console.error('Failed to join incoming call', err);
      Alert.alert('Error', err.message || 'Unable to join call. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.smallLabel}>Incoming call from</Text>
        <Text style={styles.name}>{fromLabel}</Text>
        <Text style={styles.notice}>This call may be monitored and recorded.</Text>

        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>📞</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
          >
            <Text style={styles.actionText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
          >
            <Text style={styles.actionText}>Accept</Text>
          </TouchableOpacity>
        </View>
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
  smallLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  name: {
    color: '#E5E7EB',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  notice: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  avatarText: {
    fontSize: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});
