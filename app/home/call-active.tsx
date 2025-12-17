import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '../../src/apiClient';

export default function CallActiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; roomUrl?: string; token?: string }>();
  const callId = params.id ?? '';
  const roomUrl = params.roomUrl ?? '';
  const token = params.token ?? '';

  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<any | null>(null);

  useEffect(() => {
    const setupAudioPermissions = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Microphone permission not granted. Call audio may not work.');
        }

        // Configure audio mode only on native platforms (skip on web)
        if (Platform.OS === 'ios') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } else if (Platform.OS === 'android') {
          await Audio.setAudioModeAsync({
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        }
      } catch (err) {
        console.warn('Failed to configure audio mode for call', err);
      }
    };

    setupAudioPermissions();

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Connect to realtime notifications to listen for CALL_ENDED
    const connectSocket = async () => {
      try {
        if (!callId) return;
        const token = await AsyncStorage.getItem('familyAccessToken');
        if (!token) return;

        const { io } = await import('socket.io-client');
        const socket = io(BASE_URL, {
          auth: {
            token,
          },
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('subscribe:notifications', ['calls']);
        });

        socket.on('notification', (payload: any) => {
          try {
            if (!payload || payload.type !== 'CALL_ENDED') return;
            const incomingCallId = payload.metadata && payload.metadata.callId;
            if (!incomingCallId || String(incomingCallId) !== String(callId)) return;

            // Inmate ended the call -> end locally as well
            endCall();
          } catch (err) {
            // ignore
          }
        });
      } catch {
        // ignore socket failures
      }
    };

    connectSocket();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [callId]);

  const formatTime = (total: number) => {
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const secs = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  const endCall = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Notify backend that this side has ended the call so the other participant can be informed
    try {
      if (callId) {
        const token = await AsyncStorage.getItem('familyAccessToken');
        if (token) {
          await fetch(`${BASE_URL}/calls/${callId}/end`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }
    } catch {
      // ignore network errors on end; UI should still hang up locally
    }

    router.replace({ pathname: '/home/call-end', params: { id: callId, duration: String(seconds) } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
          <Text style={styles.name}>Inmate</Text>
          <Text style={styles.status}>Secure call</Text>
        </View>

        <View style={styles.callBody}>
          {roomUrl && token ? (
            <WebView
              source={{ uri: `${roomUrl}?t=${encodeURIComponent(token)}` }}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
              mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
            />
          ) : (
            <View style={styles.fallback}>
              <Text style={styles.status}>Connecting to call...</Text>
            </View>
          )}
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
            <Text style={styles.endCallText}>End Call</Text>
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
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  timer: {
    color: '#E5E7EB',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  name: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  status: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  callBody: {
    flex: 1,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  webview: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallButton: {
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  endCallText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
