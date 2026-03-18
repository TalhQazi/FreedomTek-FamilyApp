import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

type LinkedInmate = {
  inmateId: string;
  inmateName?: string;
  facility?: string;
};

const HomeMessagesScreen: React.FC = () => {
  const router = useRouter();
  const [linkedInmates, setLinkedInmates] = useState<LinkedInmate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLinkedInmate = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('familyCurrentUser');
        if (!storedUser) {
          setLinkedInmates([]);
          return;
        }

        const parsed = JSON.parse(storedUser) || {};

        // Prefer multi-inmate list from backend login response
        let inmates: LinkedInmate[] = [];
        if (Array.isArray(parsed.inmates) && parsed.inmates.length) {
          inmates = parsed.inmates
            .filter((i: any) => i && typeof i.inmateId === 'string')
            .map((i: any) => ({
              inmateId: i.inmateId,
              inmateName: i.name,
              facility: i.facility,
            }));
        } else if (parsed.inmateId) {
          // Backwards-compatible single inmate
          inmates = [
            {
              inmateId: parsed.inmateId,
              inmateName: parsed.inmateName,
              facility: parsed.facility,
            },
          ];
        }

        setLinkedInmates(inmates);
      } finally {
        setLoading(false);
      }
    };

    loadLinkedInmate();
  }, []);

  const handleOpenInbox = (inmateId: string) => {
    if (!inmateId) {
      return;
    }
    router.push(`/home/messages/${encodeURIComponent(inmateId)}` as never);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Secure messaging with your linked inmate</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#E63946" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : !linkedInmates.length ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No inmate linked</Text>
            <Text style={styles.emptyText}>
              Your account is not linked to an inmate yet. Once linked, you will see their INM-ID here.
            </Text>
          </View>
        ) : (
          <View>
            {linkedInmates.map((item) => (
              <TouchableOpacity
                key={item.inmateId}
                style={styles.inmateCard}
                activeOpacity={0.8}
                onPress={() => handleOpenInbox(item.inmateId)}
              >
                <View style={styles.inmateAvatar}>
                  <Text style={styles.inmateAvatarText}>
                    {(item.inmateName || item.inmateId || 'I').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.inmateInfo}>
                  <Text style={styles.inmateLabel}>INM-ID</Text>
                  <Text style={styles.inmateId}>{item.inmateId}</Text>
                  {!!item.inmateName && (
                    <Text style={styles.inmateName}>{item.inmateName}</Text>
                  )}
                  {!!item.facility && (
                    <Text style={styles.inmateFacility}>{item.facility}</Text>
                  )}
                  <Text style={styles.inboxHint}>Tap to open inbox and send a message request</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E1F25',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1E1F25',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E5E7EB',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#9CA3AF',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#E5E7EB',
  },
  inmateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2B31',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  inmateAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  inmateAvatarText: {
    color: '#E5E7EB',
    fontSize: 22,
    fontWeight: '700',
  },
  inmateInfo: {
    flex: 1,
  },
  inmateLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 2,
  },
  inmateId: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
  },
  inmateName: {
    marginTop: 4,
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  inmateFacility: {
    marginTop: 2,
    color: '#9CA3AF',
    fontSize: 13,
  },
  inboxHint: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 12,
  },
  emptyTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

export default HomeMessagesScreen;