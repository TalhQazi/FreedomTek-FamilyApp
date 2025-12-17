import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FamilyCurrentUser = {
  id: string;
  name: string;
  email: string;
  relation: string;
  inmateId: string;
  inmateName?: string;
  facility?: string;
};

export default function HomeProfileScreen() {
  const [user, setUser] = useState<FamilyCurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const raw = await AsyncStorage.getItem('familyCurrentUser');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setUser(parsed);
          } catch (e) {
            console.warn('Failed to parse familyCurrentUser from storage', e);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const renderRow = (label: string, value?: string) => {
    if (!value) return null;
    return (
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>
          View your account details and inmate information.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#E5E7EB" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : !user ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            No profile information found. Please log in again.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardPrimary}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <Text style={styles.nameText}>{user.name}</Text>
            <Text style={styles.relationText}>{user.relation}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.sectionDivider} />
            {renderRow('Email', user.email)}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Inmate</Text>
            <View style={styles.sectionDivider} />
            {renderRow('Inmate Name', user.inmateName || 'Unknown')}
            {renderRow('Inmate ID', user.inmateId)}
            {renderRow('Facility', user.facility)}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#111827',
  },
  headerTitle: {
    color: '#E5E7EB',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 14,
  },
  errorText: {
    color: '#F97373',
    fontSize: 14,
    textAlign: 'center',
  },
  cardPrimary: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
  },
  nameText: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
  },
  relationText: {
    marginTop: 4,
    color: '#9CA3AF',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginTop: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  rowValue: {
    color: '#F9FAFB',
    fontSize: 14,
    marginLeft: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
});
