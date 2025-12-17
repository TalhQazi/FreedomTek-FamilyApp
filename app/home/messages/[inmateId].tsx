import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getFamilyThreadMessages, sendFamilyMessage } from '../../../src/apiClient';

interface FamilyMessage {
  _id: string;
  body: string;
  status: 'pending' | 'delivered' | 'rejected';
  createdAt: string;
  sourceMessageId?: string; // present when mirrored from an inmate message
}

const ThreadScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const inmateId = typeof params.inmateId === 'string' ? params.inmateId : '';

  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!inmateId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const token = await AsyncStorage.getItem('familyAccessToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const data = await getFamilyThreadMessages(token, inmateId);
        setMessages(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [inmateId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !inmateId) return;

    try {
      setSending(true);
      const token = await AsyncStorage.getItem('familyAccessToken');
      if (!token) {
        setSending(false);
        return;
      }

      const created = await sendFamilyMessage(token, inmateId, trimmed);

      setMessages((prev) => [...prev, created]);
      setInput('');
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: FamilyMessage }) => {
    const createdAt = item.createdAt ? new Date(item.createdAt) : null;
    const time = createdAt
      ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    const fromInmate = !!item.sourceMessageId;

    let statusLabel = '';
    if (item.status === 'pending') statusLabel = fromInmate ? 'Pending review' : 'Pending approval';
    if (item.status === 'delivered') statusLabel = fromInmate ? 'Delivered from inmate' : 'Delivered to inmate';
    if (item.status === 'rejected') statusLabel = 'Rejected by facility';

    return (
      <View style={[
        styles.messageRow,
        fromInmate ? styles.messageRowInmate : styles.messageRowFamily,
      ]}>
        <View style={[
          styles.messageBubble,
          fromInmate ? styles.messageBubbleInmate : styles.messageBubbleFamily,
        ]}>
          <Text style={styles.messageText}>{item.body}</Text>
          <View style={styles.messageMetaRow}>
            <Text style={styles.messageTime}>{time}</Text>
            {!!statusLabel && <Text style={styles.messageStatus}>{statusLabel}</Text>}
          </View>
        </View>
      </View>
    );
  };

  if (!inmateId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No inmate selected.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#E63946" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>INM-ID: {inmateId}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Write a message to your inmate..."
          placeholderTextColor="#6B7280"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#111827',
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  headerTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  messageRowFamily: {
    justifyContent: 'flex-end',
  },
  messageRowInmate: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleFamily: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  messageBubbleInmate: {
    backgroundColor: '#374151',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  messageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  messageTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  messageStatus: {
    color: '#FBBF24',
    fontSize: 11,
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#111827',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1F2937',
    color: '#E5E7EB',
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#E63946',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1F25',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#E5E7EB',
    fontSize: 14,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ThreadScreen;
