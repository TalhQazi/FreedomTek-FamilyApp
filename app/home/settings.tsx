import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type UserProfile = {
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  profilePhoto?: string;
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Family User',
  email: 'Not set',
};

const HomeSettingsScreen: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('userProfile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setProfile({ ...DEFAULT_PROFILE, ...parsed });
        return;
      }

      // Fallback: derive basic info from familyCurrentUser if available
      const familyUserRaw = await AsyncStorage.getItem('familyCurrentUser');
      if (familyUserRaw) {
        const current = JSON.parse(familyUserRaw);
        setProfile({
          name: current.name || DEFAULT_PROFILE.name,
          email: current.email || DEFAULT_PROFILE.email,
        });
        return;
      }
    } catch {
      setProfile(DEFAULT_PROFILE);
    }
  };

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              'userProfile',
              'balance',
              'transactions',
              'messages',
              'language',
              'loggedIn',
              'currentUser',
              'familyAccessToken',
              'familyRefreshToken',
              'familyCurrentUser',
            ]);
          } catch {
            // ignore
          } finally {
            router.replace('/login' as never);
          }
        },
      },
    ]);
  };

  const Row = ({
    title,
    subtitle,
    onPress,
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      disabled={!onPress}>
      <View>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.rowArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Block */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials || 'F'}</Text>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          {profile.relationship ? (
            <Text style={styles.profileRelationship}>Relationship: {profile.relationship}</Text>
          ) : null}
          {profile.phone ? (
            <Text style={styles.profilePhone}>{profile.phone}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.editProfileButton}
            activeOpacity={0.9}
            onPress={() => router.push('/settings/editProfile' as never)}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* App Settings Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.sectionDivider} />

          <Row
            title="Language"
            subtitle="Change app language"
            onPress={() => router.push('/settings/changeLanguage' as never)}
          />

          <Row
            title="Notifications"
            subtitle="Messages, calls, balance alerts"
            onPress={() => router.push('/settings/notifications' as never)}
          />

          <Row
            title="Privacy & Terms"
            subtitle="Read our policies"
            onPress={() => router.push('/settings/privacyTerms' as never)}
          />
        </View>

        {/* Security & Logout */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account & Security</Text>
          <View style={styles.sectionDivider} />

          <Row
            title="Account Email"
            subtitle={profile.email}
          />

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.9}
            onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E1F25',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: '#2A2B31',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#E5E7EB',
    fontSize: 28,
    fontWeight: '700',
  },
  profileName: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 2,
  },
  profileRelationship: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  profilePhone: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  editProfileButton: {
    marginTop: 12,
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#2A2B31',
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
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowTitle: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  rowArrow: {
    color: '#9CA3AF',
    fontSize: 20,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 12,
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default HomeSettingsScreen;
