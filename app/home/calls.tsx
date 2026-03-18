import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BASE_URL, createFamilyCall, getFamilyCalls } from '../../src/apiClient';

type CallStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';

type CallItem = {
  id: string;
  scheduledAt: string; // ISO string
  createdAt: string; // ISO string
  notes?: string;
  status: CallStatus;
  inmateId?: string;
};

type LinkedInmate = {
  inmateId: string;
  inmateName?: string;
  facility?: string;
};

const CallsScreen: React.FC = () => {
  const router = useRouter();
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [linkedInmates, setLinkedInmates] = useState<LinkedInmate[]>([]);
  const [inmateId, setInmateId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [usedCallIds, setUsedCallIds] = useState<string[]>([]);

  useEffect(() => {
    loadCalls();
    loadUsedCallIds();
  }, []);

  useEffect(() => {
    const loadInmates = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('familyCurrentUser');
        if (!storedUser) {
          setLinkedInmates([]);
          setInmateId(null);
          return;
        }

        const parsed = JSON.parse(storedUser) || {};

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
          inmates = [
            {
              inmateId: parsed.inmateId,
              inmateName: parsed.inmateName,
              facility: parsed.facility,
            },
          ];
        }

        setLinkedInmates(inmates);
        setInmateId(inmates[0]?.inmateId ?? null);
      } catch {
        setLinkedInmates([]);
        setInmateId(null);
      }
    };

    loadInmates();
  }, []);

  const loadUsedCallIds = async () => {
    try {
      const raw = await AsyncStorage.getItem('familyUsedCallIds');
      if (!raw) {
        setUsedCallIds([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setUsedCallIds(parsed.map(String));
      } else {
        setUsedCallIds([]);
      }
    } catch {
      setUsedCallIds([]);
    }
  };

  const mapStatus = (backendStatus: string): CallStatus => {
    if (backendStatus === 'approved') return 'Approved';
    if (backendStatus === 'rejected') return 'Rejected';
    if (backendStatus === 'used') return 'Completed';
    return 'Pending';
  };

  const loadCalls = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('familyAccessToken');
      if (!token) {
        setCalls([]);
        setLoading(false);
        return;
      }

      const backendCalls = await getFamilyCalls(token);

      const mapped: CallItem[] = Array.isArray(backendCalls)
        ? backendCalls.map((c: any) => {
            const scheduled = c.scheduledAt || c.createdAt || new Date().toISOString();
            const created = c.createdAt || scheduled;
            return {
              id: String(c._id),
              scheduledAt: scheduled,
              createdAt: created,
              notes: c.notes || '',
              status: mapStatus(c.status),
              inmateId: c.inmateId,
            };
          })
        : [];

      const sorted = [...mapped].sort((a, b) => (a.scheduledAt > b.scheduledAt ? -1 : 1));
      setCalls(sorted);
      // Refresh local used call ids whenever we reload calls
      await loadUsedCallIds();
    } catch (error: any) {
      console.error('Failed to load family calls', error);
      const message = error?.message || 'Failed to load calls';
      if (typeof message === 'string' && (message.toLowerCase().includes('token') || message.toLowerCase().includes('unauthorized'))) {
        Alert.alert('Session expired', 'Your session has expired. Please log in again.');
        try {
          await AsyncStorage.removeItem('familyAccessToken');
        } catch {
          // ignore
        }
      } else {
        Alert.alert('Error', message);
      }
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: CallStatus) => {
    switch (status) {
      case 'Approved':
        return '#10B981';
      case 'Rejected':
        return '#EF4444';
      case 'Pending':
      default:
        return '#FBBF24';
    }
  };

  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    const datePart = date.toLocaleDateString();
    const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${datePart} • ${timePart}`;
  };

  const handleOpenNew = () => {
    setSelectedDate(null);
    setCallNotes('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedDate || submitting || !inmateId) {
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('familyAccessToken');
      if (!token) {
        setSubmitting(false);
        return;
      }

      const isoDateTime = selectedDate.toISOString();

      await createFamilyCall(token, {
        scheduledAt: isoDateTime,
        notes: callNotes.trim() || undefined,
        inmateId,
      });

      setShowModal(false);
      await loadCalls();
    } catch (error: any) {
      console.error('Failed to create call', error);
      const message = error?.message || 'Failed to create call request';
      if (typeof message === 'string' && (message.toLowerCase().includes('token') || message.toLowerCase().includes('unauthorized'))) {
        Alert.alert('Session expired', 'Your session has expired. Please log in again.');
        try {
          await AsyncStorage.removeItem('familyAccessToken');
        } catch {
          // ignore
        }
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: CallItem }) => {
    const isCompleted = item.status === 'Completed';
    const isExpired = isCompleted; // treat completed calls as expired/used
    const showStartCall = item.status === 'Approved' && !isCompleted;

    let footerText: string;
    let footerIcon: string;

    if (showStartCall) {
      footerText = '';
      footerIcon = '';
    } else if (item.status === 'Pending') {
      footerText = 'Awaiting approval';
      footerIcon = '⏳';
    } else if (isCompleted) {
      footerText = 'Call already done.';
      footerIcon = '✅';
    } else {
      footerText = 'This request was rejected by the admin.';
      footerIcon = '⛔';
    }

    const linkedInmate = item.inmateId
      ? linkedInmates.find((i) => i.inmateId === item.inmateId)
      : undefined;

    const inmateLabel = item.inmateId
      ? linkedInmate && linkedInmate.inmateName
        ? `${item.inmateId}  ${linkedInmate.inmateName}`
        : item.inmateId
      : undefined;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>Call</Text>
          </View>
          <Text style={styles.dateText}>{formatDateTime(item.scheduledAt)}</Text>
        </View>

        {inmateLabel ? (
          <Text style={styles.inmateInfoText}>{inmateLabel}</Text>
        ) : null}

        {item.notes ? (
          <Text style={styles.notesText} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : (
          <Text style={styles.notesTextMuted}>No notes provided</Text>
        )}

        <View style={styles.cardFooterRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>

          {showStartCall ? (
            <TouchableOpacity
              style={styles.callButton}
              onPress={async () => {
                try {
                  const token = await AsyncStorage.getItem('familyAccessToken');
                  if (!token) {
                    Alert.alert('Session expired', 'Please log in again to start a call.');
                    return;
                  }

                  const res = await fetch(`${BASE_URL}/calls`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ familyCallId: item.id }),
                  });

                  if (!res.ok) {
                    const text = await res.text();
                    let message = 'Failed to start call';
                    try {
                      const data = JSON.parse(text);
                      if (data && data.error) message = data.error;
                    } catch {}
                    throw new Error(message);
                  }

                  const created = await res.json();

                  router.push({
                    pathname: '/home/outgoing-call',
                    params: {
                      id: String(created.callId),
                      roomUrl: created.roomUrl,
                      token: created.token,
                    },
                  });
                } catch (err: any) {
                  console.error('Failed to start family call', err);
                  Alert.alert('Error', err?.message || 'Unable to start call. Please try again.');
                }
              }}
            >
              <Text style={styles.callButtonIcon}>▶</Text>
              <Text style={styles.callButtonText}>Start Call</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.footerInfo}>
              <Text style={styles.footerIcon}>{footerIcon}</Text>
              <Text style={styles.footerText}>{footerText}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Calls</Text>
          <Text style={styles.headerSubtitle}>Schedule and track your call requests</Text>
        </View>
        <TouchableOpacity
          style={styles.newButton}
          activeOpacity={0.9}
          onPress={handleOpenNew}
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={calls}
        keyExtractor={(item) => String(item.id)}
        refreshing={loading}
        onRefresh={loadCalls}
        contentContainerStyle={
          calls.length === 0 ? styles.emptyContent : styles.listContent
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No calls yet</Text>
            <Text style={styles.emptyText}>
              Start by creating a new call request with your inmate.
            </Text>
          </View>
        }
      />

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Call Request</Text>
            <Text style={styles.modalSubtitle}>
              Enter the date & time for your requested call.
            </Text>

            <Text style={styles.modalLabel}>Inmate</Text>
            {linkedInmates.length ? (
              <View style={styles.inmateChipsRow}>
                {linkedInmates.map((i) => (
                  <TouchableOpacity
                    key={i.inmateId}
                    style={[
                      styles.inmateChip,
                      inmateId === i.inmateId && styles.inmateChipSelected,
                    ]}
                    onPress={() => setInmateId(i.inmateId)}
                  >
                    <Text
                      style={[
                        styles.inmateChipText,
                        inmateId === i.inmateId && styles.inmateChipTextSelected,
                      ]}
                    >
                      {i.inmateId}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyText}>Not available</Text>
              </View>
            )}

            <Text style={styles.modalLabel}>Date & Time</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setPickerMode('date');
                setShowPicker(true);
              }}
            >
              <Text style={styles.dateButtonText}>
                {selectedDate
                  ? formatDateTime(selectedDate.toISOString())
                  : 'Select date & time'}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode={pickerMode}
                display="default"
                onChange={(event, date) => {
                  if (!date || event.type === 'dismissed') {
                    setShowPicker(false);
                    return;
                  }

                  const current = selectedDate || new Date();
                  const updated = new Date(current);

                  if (pickerMode === 'date') {
                    updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                    setPickerMode('time');
                    setSelectedDate(updated);
                    setTimeout(() => {
                      setShowPicker(true);
                    }, 0);
                  } else {
                    updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
                    setSelectedDate(updated);
                    setShowPicker(false);
                  }
                }}
              />
            )}

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
                onPress={() => setShowModal(false)}
                disabled={submitting}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CallsScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E1F25',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1E1F25',
  },
  headerTitle: {
    color: '#E5E7EB',
    fontSize: 26,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  newButton: {
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#2A2B31',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#E63946',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  inmateInfoText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 4,
  },
  notesText: {
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 12,
  },
  notesTextMuted: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  callButtonIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
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
  readonlyField: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  readonlyText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  dateButton: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  dateButtonText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  inmateChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  inmateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1F2937',
  },
  inmateChipSelected: {
    backgroundColor: '#E63946',
  },
  inmateChipText: {
    color: '#E5E7EB',
    fontSize: 13,
  },
  inmateChipTextSelected: {
    fontWeight: '700',
    color: '#F9FAFB',
  },
});