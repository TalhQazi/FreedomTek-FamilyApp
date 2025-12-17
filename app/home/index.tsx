import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BASE_URL, createFamilyCall, FamilyWalletState, getFamilyWallet } from '../../src/apiClient';
import { PlanId, usePlan } from '../../src/planContext';

type InmateInfo = {
  name: string;
  id: string;
  facility: string;
  status: string;
};

type ActivityItem = {
  id: string;
  type: 'message' | 'photo' | 'request' | 'schedule';
  text: string;
};

type CurrentUser = {
  name?: string;
  email?: string;
  relation?: string;
  inmateId?: string;
  inmateName?: string;
  facility?: string;
};

const DEFAULT_INMATE: InmateInfo = {
  name: 'John Adams',
  id: 'FT-11928',
  facility: 'Arizona State Facility',
  status: 'Active',
};

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { id: '1', type: 'message', text: 'John sent you a new message' },
  { id: '2', type: 'photo', text: 'You received a new photo from John' },
  { id: '3', type: 'request', text: 'Your medical request is under review' },
  { id: '4', type: 'schedule', text: 'Upcoming visit tomorrow at 3:00 PM' },
];

const HomeDashboardScreen: React.FC = () => {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [inmate, setInmate] = useState<InmateInfo>(DEFAULT_INMATE);

  const [unreadMessages, setUnreadMessages] = useState(4);
  const [pendingRequests, setPendingRequests] = useState(2);
  const [newPhotos, setNewPhotos] = useState(3);
  const [upcomingVisit, setUpcomingVisit] = useState('Tomorrow 3:00 PM');
  const [activities, setActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callDateTime, setCallDateTime] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [submittingCall, setSubmittingCall] = useState(false);
  const { currentPlan, setCurrentPlan } = usePlan();

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('familyCurrentUser');
        if (storedUser) {
          const parsed: CurrentUser = JSON.parse(storedUser);
          setUser(parsed);

          // Derive inmate info from backend user object
          if (parsed.inmateId || parsed.inmateName || parsed.facility) {
            setInmate({
              name: parsed.inmateName || DEFAULT_INMATE.name,
              id: parsed.inmateId || DEFAULT_INMATE.id,
              facility: parsed.facility || DEFAULT_INMATE.facility,
              status: DEFAULT_INMATE.status,
            });
          }
        }
      } catch {
        // If anything fails, we keep dummy defaults
      }
    };

    loadData();
  }, []);

  // Load wallet to determine which plan is active for access control
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const token = await AsyncStorage.getItem('familyAccessToken');
        if (!token) return;
        const wallet: FamilyWalletState = await getFamilyWallet(token);
        setCurrentPlan(wallet.currentPlan || null);
      } catch {
        // If wallet fails, we keep currentPlan as null and rely on Balance screen
      }
    };

    loadWallet();
  }, []);

  // Realtime incoming call listener via WebSocket
  useEffect(() => {
    let isMounted = true;

    const setupSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('familyAccessToken');
        if (!token || !isMounted) return;

        console.log('[Calls][Family] Initialising socket connection to', BASE_URL);

        const { io } = await import('socket.io-client');
        const socket = io(BASE_URL, {
          auth: {
            token,
          },
        });

        socket.on('connect', () => {
          console.log('[Calls][Family] Socket connected');
          socket.emit('subscribe:notifications', ['calls']);
        });

        socket.on('connect_error', (err: any) => {
          console.error('[Calls][Family] Socket connect_error', err);
        });

        socket.on('error', (err: any) => {
          console.error('[Calls][Family] Socket error', err);
        });

        socket.on('notification', (payload: any) => {
          try {
            if (!payload || payload.type !== 'CALL_INCOMING') return;
            const callId = payload.metadata && payload.metadata.callId;
            if (!callId) return;

            console.log('[Calls][Family] Received CALL_INCOMING', payload);

            router.push({
              pathname: '/home/incoming-call',
              params: {
                id: String(callId),
                fromLabel: 'Inmate',
              },
            });
          } catch (e) {
            console.error('Failed to handle incoming CALL_INCOMING notification', e);
          }
        });

        socket.on('disconnect', (reason: any) => {
          console.log('[Calls][Family] Socket disconnected', reason);
        });
      } catch (e) {
        console.error('Failed to setup call notifications socket', e);
      }
    };

    setupSocket();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const greetingName = user?.name || 'Family Member';

  type FeatureKey = 'messages' | 'photos' | 'requests' | 'schedule' | 'calls';

  const canAccessFeature = (feature: FeatureKey): boolean => {
    if (!currentPlan) {
      return false;
    }

    if (currentPlan === 'bronze') {
      return feature === 'messages';
    }

    if (currentPlan === 'silver') {
      return (
        feature === 'messages' ||
        feature === 'photos' ||
        feature === 'requests' ||
        feature === 'schedule'
      );
    }

    // Gold: everything
    return true;
  };

  const handleQuickNav = (path: string) => {
    router.push(path as never);
  };

  const handleProtectedNav = (feature: FeatureKey, path: string) => {
    if (!canAccessFeature(feature)) {
      Alert.alert(
        'Upgrade required',
        'This feature is not available on your current plan. You can upgrade on the Balance screen.',
      );
      return;
    }
    handleQuickNav(path);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return '💬';
      case 'photo': return '🖼️';
      case 'request': return '📋';
      case 'schedule': return '📅';
      default: return '🔔';
    }
  };

  const renderActivityItem = ({ item, index }: { item: ActivityItem; index: number }) => (
    <Animated.View
      style={[
        styles.activityItem,
        { opacity: 1 - (index * 0.1) } // Subtle fade effect for older items
      ]}
    >
      <View style={styles.activityIconContainer}>
        <Text style={styles.activityIcon}>{getActivityIcon(item.type)}</Text>
      </View>
      <Text style={styles.activityText}>{item.text}</Text>
      <View style={[
        styles.activityDot,
        { backgroundColor: item.type === 'message' ? '#E63946' : 
                         item.type === 'photo' ? '#3B82F6' : 
                         item.type === 'request' ? '#F59E0B' : '#10B981' }
      ]} />
    </Animated.View>
  );

  const QuickActionCard = ({
    icon,
    label,
    onPress,
    disabled,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.quickCard, disabled && styles.quickCardDisabled]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View style={styles.quickIconContainer}>
        <Text style={styles.quickIcon}>{icon}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const SummaryCard = ({ label, value, isSmall = false }: { label: string; value: string | number; isSmall?: boolean }) => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={isSmall ? styles.summaryValueSmall : styles.summaryValue}>
        {value}
      </Text>
    </View>
  );

  const handleOpenCallModal = () => {
    setCallDateTime('');
    setCallNotes('');
    setShowCallModal(true);
  };

  const handleScheduleCall = async () => {
    if (!callDateTime.trim() || submittingCall) {
      return;
    }

    try {
      setSubmittingCall(true);
      const token = await AsyncStorage.getItem('familyAccessToken');
      if (!token) {
        setSubmittingCall(false);
        return;
      }

      const isoDateTime = new Date(callDateTime).toISOString();

      await createFamilyCall(token, {
        scheduledAt: isoDateTime,
        notes: callNotes.trim() || undefined,
      });

      setShowCallModal(false);
    } catch (error) {
      setShowCallModal(false);
    } finally {
      setSubmittingCall(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerGreeting}>Hello,</Text>
            <Text style={styles.headerName}>{greetingName}</Text>
          </View>
          <View style={styles.headerIcons}>
            {/* <TouchableOpacity style={styles.iconPill}>
              <Text style={styles.iconPillText}>🌐</Text>
            </TouchableOpacity> */}
            {/* <TouchableOpacity style={[styles.iconPill, styles.notificationPill]}>
              <Text style={styles.iconPillText}>🔔</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.iconPill}
              onPress={() => handleQuickNav('/home/settings')}>
              <Text style={styles.iconPillText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showCallModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCallModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Schedule a Call</Text>
              <Text style={styles.modalSubtitle}>Inmate ID: {inmate.id}</Text>

              <Text style={styles.modalLabel}>Date & Time (e.g. 2025-12-03 18:30)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD HH:mm"
                placeholderTextColor="#6B7280"
                value={callDateTime}
                onChangeText={setCallDateTime}
              />

              <Text style={styles.modalLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                multiline
                numberOfLines={3}
                placeholder="Any details for this call..."
                placeholderTextColor="#6B7280"
                value={callNotes}
                onChangeText={setCallNotes}
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowCallModal(false)}
                  disabled={submittingCall}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleScheduleCall}
                  disabled={submittingCall}
                >
                  <Text style={styles.modalButtonPrimaryText}>
                    {submittingCall ? 'Scheduling...' : 'Schedule Call'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Inmate card */}
        <View style={styles.inmateCard}>
          <View style={styles.inmateAvatar}>
            <Text style={styles.inmateAvatarText}>{inmate.name.charAt(0)}</Text>
          </View>
          <View style={styles.inmateInfo}>
            <View style={styles.inmateHeader}>
              <Text style={styles.inmateName}>{inmate.name}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{inmate.status}</Text>
              </View>
            </View>
            <Text style={styles.inmateMeta}>ID: {inmate.id}</Text>
            <Text style={styles.inmateMeta}>Facility: {inmate.facility}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => handleQuickNav('/home/profile')}>
            <Text style={styles.viewProfileText}>View Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickGrid}>
            <QuickActionCard
              icon="📩"
              label="Messages"
              onPress={() => handleProtectedNav('messages', '/home/messages')}
              disabled={!canAccessFeature('messages')}
            />
            <QuickActionCard
              icon="📸"
              label="Photos"
              onPress={() => handleProtectedNav('photos', '/photos')}
              disabled={!canAccessFeature('photos')}
            />
            <QuickActionCard
              icon="📝"
              label="Requests"
              onPress={() => handleProtectedNav('requests', '/requests')}
              disabled={!canAccessFeature('requests')}
            />
            <QuickActionCard
              icon="📅"
              label="Schedule"
              onPress={() => handleProtectedNav('schedule', '/home/schedule')}
              disabled={!canAccessFeature('schedule')}
            />
            <QuickActionCard
              icon="📞"
              label="Calls"
              onPress={() => handleProtectedNav('calls', '/home/calls')}
              disabled={!canAccessFeature('calls')}
            />
            <QuickActionCard
              icon="💰"
              label="Balance"
              onPress={() => handleQuickNav('/home/balance')}
            />
            <QuickActionCard
              icon="💳"
              label="Pricing"
              onPress={() => handleQuickNav('/home/pricing')}
            />
            <QuickActionCard
              icon="ℹ️"
              label="Info"
              onPress={() => handleQuickNav('/home/info')}
            />
            <QuickActionCard
              icon="⚙️"
              label="Settings"
              onPress={() => handleQuickNav('/home/settings')}
            />
          </View>
        </View>

        {/* Summary cards */}
        {/* <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Summary</Text>
          </View>
          <View style={styles.summaryGrid}>
            <SummaryCard label="Unread Messages" value={unreadMessages} />
            <SummaryCard label="Pending Requests" value={pendingRequests} />
            <SummaryCard label="New Photos" value={newPhotos} />
            <SummaryCard label="Next Visit" value={upcomingVisit} isSmall />
          </View>
        </View> */}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E1F25',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerGreeting: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerName: {
    color: '#E5E7EB',
    fontSize: 28,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2B31',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  notificationPill: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E63946',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E1F25',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  iconPillText: {
    color: '#E5E7EB',
    fontSize: 18,
  },
  inmateCard: {
    backgroundColor: '#2A2B31',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  inmateAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E63946',
  },
  inmateAvatarText: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '700',
  },
  inmateInfo: {
    flex: 1,
  },
  inmateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  inmateName: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 4,
  },
  statusText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '600',
  },
  inmateMeta: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 2,
  },
  viewProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E63946',
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewProfileText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    color: '#E63946',
    fontSize: 14,
    fontWeight: '600',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickCard: {
    width: '31%',
    height: 100,
    backgroundColor: '#2A2B31',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickCardDisabled: {
    opacity: 0.4,
  },
  quickIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickIcon: {
    fontSize: 22,
  },
  quickLabel: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#2A2B31',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  summaryValue: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '700',
  },
  summaryValueSmall: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#2A2B31',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 16,
  },
  activityText: {
    color: '#E5E7EB',
    fontSize: 15,
    flex: 1,
    fontWeight: '500',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activitySeparator: {
    height: 1,
    backgroundColor: '#374151',
    marginLeft: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    color: '#E5E7EB',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 16,
  },
  modalLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 12,
  },
  modalInputMultiline: {
    textAlignVertical: 'top',
    height: 80,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  modalButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalButtonSecondary: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  modalButtonPrimary: {
    backgroundColor: '#E63946',
  },
  modalButtonSecondaryText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default HomeDashboardScreen;