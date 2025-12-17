import React, { useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../src/apiClient';

export default function OutgoingCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; roomUrl?: string; token?: string }>();
  const callId = params.id ?? '';
  const roomUrl = params.roomUrl ?? '';
  const token = params.token ?? '';

  useEffect(() => {
    let isMounted = true;
    let socket: any = null;

    const waitForAcceptance = async () => {
      try {
        if (!callId) {
          return;
        }

        const storedToken = await AsyncStorage.getItem('familyAccessToken');
        if (!storedToken || !isMounted) {
          return;
        }

        const { io } = await import('socket.io-client');
        socket = io(BASE_URL, {
          auth: {
            token: storedToken,
          },
        });

        socket.on('connect', () => {
          socket.emit('subscribe:notifications', ['calls']);
        });

        socket.on('notification', (payload: any) => {
          try {
            if (!payload || payload.type !== 'CALL_ACCEPTED') return;
            const incomingCallId = payload.metadata && payload.metadata.callId;
            if (!incomingCallId || String(incomingCallId) !== String(callId)) return;

            if (!isMounted) return;

            router.replace({
              pathname: '/home/call-active',
              params: {
                id: String(callId),
                roomUrl,
                token,
              },
            });
          } catch (err) {
            // ignore
          }
        });
      } catch {
        // ignore socket setup failures; user can retry call
      }
    };

    waitForAcceptance();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [callId, roomUrl, token, router]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Calling Inmate...</Text>
        <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 24 }} />
        <Text style={styles.subtitle}>Connecting to secure facility line</Text>

        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>📞</Text>
        </View>

        <TouchableOpacity style={styles.endButton} onPress={() => router.replace('/home/calls')}>
          <Text style={styles.endButtonText}>Cancel</Text>
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
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  avatarText: {
    fontSize: 40,
  },
  endButton: {
    marginTop: 40,
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
