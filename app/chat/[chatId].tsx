import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Message = {
  id: number;
  sender: 'family' | 'inmate';
  text: string;
  time: string;
  timestamp: number;
  attachment?: {
    type: 'image' | 'video';
    uri: string;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
};

type Conversation = {
  chatId: number;
  inmateId: string;
  inmateName: string;
  messages: Message[];
  unread: number;
  lastMessage: string;
  lastTime: string;
  facility: string;
};

const { width: screenWidth } = Dimensions.get('window');

const ChatScreen: React.FC = () => {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const listRef = useRef<FlatList<Message>>(null);

  const numericChatId = Number(chatId);

  useEffect(() => {
    loadConversation();
  }, [numericChatId]);

  const loadConversation = async () => {
    setIsLoading(true);
    try {
      const raw = await AsyncStorage.getItem('messages');
      const all: Conversation[] = raw ? JSON.parse(raw) : [];
      const found = all.find((c) => c.chatId === numericChatId);

      if (!found) {
        Alert.alert('Info', 'No conversation found.');
        router.back();
        return;
      }

      setConversation(found);

      // Mark as read in inbox
      const inboxRaw = await AsyncStorage.getItem('inbox');
      if (inboxRaw) {
        const inbox: Conversation[] = JSON.parse(inboxRaw);
        const updatedInbox = inbox.map((c) =>
          c.chatId === numericChatId
            ? {
                ...c,
                unread: 0,
              }
            : c,
        );
        await AsyncStorage.setItem('inbox', JSON.stringify(updatedInbox));
      }
    } catch {
      Alert.alert('Error', 'Unable to load messages.');
    } finally {
      setIsLoading(false);
    }
  };
  const getAvatarColor = (name: string) => {
  const colors = ['#E63946', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

  const scrollToBottom = () => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const persistConversation = async (updatedConversation: Conversation, previewText: string, time: string) => {
    try {
      const raw = await AsyncStorage.getItem('messages');
      const all: Conversation[] = raw ? JSON.parse(raw) : [];
      const updatedAll = all.map((c) => (c.chatId === numericChatId ? updatedConversation : c));
      await AsyncStorage.setItem('messages', JSON.stringify(updatedAll));

      const inboxRaw = await AsyncStorage.getItem('inbox');
      if (inboxRaw) {
        const inbox: Conversation[] = JSON.parse(inboxRaw);
        const updatedInbox = inbox.map((c) =>
          c.chatId === numericChatId
            ? {
                ...c,
                lastMessage: previewText,
                lastTime: time,
                unread: 0,
              }
            : c,
        );
        await AsyncStorage.setItem('inbox', JSON.stringify(updatedInbox));
      }
    } catch {
      // ignore for now
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation || sending) return;

    setSending(true);

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timestamp = now.getTime();

    const newMessage: Message = {
      id: timestamp,
      sender: 'family',
      text: input.trim(),
      time,
      timestamp,
      status: 'sending',
    };

    const updatedConversation: Conversation = {
      ...conversation,
      messages: [...conversation.messages, newMessage],
      lastMessage: newMessage.text,
      lastTime: newMessage.time,
      unread: 0,
    };

    setConversation(updatedConversation);
    setInput('');
    scrollToBottom();

    // Simulate sending delay
    setTimeout(async () => {
      const sentMessage: Message = {
        ...newMessage,
        status: 'delivered',
      };

      const finalConversation: Conversation = {
        ...updatedConversation,
        messages: updatedConversation.messages.map(msg => 
          msg.id === newMessage.id ? sentMessage : msg
        ),
      };

      setConversation(finalConversation);
      await persistConversation(finalConversation, sentMessage.text, sentMessage.time);
      setSending(false);
    }, 1000);
  };

  const handlePickAttachment = async () => {
    if (!conversation || sending) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow media library access to attach files.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    setSending(true);

    const asset = result.assets[0];
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timestamp = now.getTime();

    const newMessage: Message = {
      id: timestamp,
      sender: 'family',
      text: '📷 Photo',
      time,
      timestamp,
      status: 'sending',
      attachment: {
        type: 'image',
        uri: asset.uri,
      },
    };

    const updatedConversation: Conversation = {
      ...conversation,
      messages: [...conversation.messages, newMessage],
      lastMessage: newMessage.text,
      lastTime: newMessage.time,
      unread: 0,
    };

    setConversation(updatedConversation);
    scrollToBottom();

    // Simulate sending delay
    setTimeout(async () => {
      const sentMessage: Message = {
        ...newMessage,
        status: 'delivered',
      };

      const finalConversation: Conversation = {
        ...updatedConversation,
        messages: updatedConversation.messages.map(msg => 
          msg.id === newMessage.id ? sentMessage : msg
        ),
      };

      setConversation(finalConversation);
      await persistConversation(finalConversation, sentMessage.text, sentMessage.time);
      setSending(false);
    }, 1500);
  };

  

  const renderMessageStatus = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <ActivityIndicator size="small" color="#9CA3AF" />;
      case 'sent':
        return <Text style={styles.statusText}>✓</Text>;
      case 'delivered':
        return <Text style={styles.statusText}>✓✓</Text>;
      case 'read':
        return <Text style={[styles.statusText, styles.statusRead]}>✓✓</Text>;
      default:
        return null;
    }
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isFamily = item.sender === 'family';
    const showAvatar = !isFamily;
    const avatarColor = getAvatarColor(conversation?.inmateName || '');
    
    return (
      <View
        style={[
          styles.messageContainer,
          isFamily ? styles.messageContainerRight : styles.messageContainerLeft,
        ]}>
        
        {showAvatar && (
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>
              {conversation?.inmateName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.messageContent}>
          <View
            style={[
              styles.bubble,
              isFamily ? styles.bubbleFamily : styles.bubbleInmate,
            ]}>
            
            {item.attachment && item.attachment.type === 'image' && (
              <TouchableOpacity 
                style={styles.attachmentContainer}
                activeOpacity={0.9}
              >
                <Image 
                  source={{ uri: item.attachment.uri }} 
                  style={styles.attachmentImage} 
                  contentFit="cover"
                />
                <View style={styles.attachmentOverlay}>
                  <Text style={styles.attachmentText}>📷 Photo</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {!!item.text && (
              <Text
                style={[
                  styles.bubbleText,
                  isFamily ? styles.bubbleTextFamily : styles.bubbleTextInmate,
                ]}>
                {item.text}
              </Text>
            )}
            
            <View style={styles.bubbleFooter}>
              <Text style={styles.bubbleTime}>{item.time}</Text>
              {isFamily && renderMessageStatus(item.status)}
            </View>
          </View>
        </View>
        
        {!showAvatar && <View style={styles.avatarSpacer} />}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E63946" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Conversation not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
const avatarColor = getAvatarColor(conversation.inmateName);
const initial = conversation.inmateName.charAt(0).toUpperCase();
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

       <View style={styles.headerInfo}>
  <View style={[styles.headerAvatar, { backgroundColor: avatarColor }]}>
    <Text style={styles.headerAvatarText}>{initial}</Text>
  </View>
  <View style={styles.headerText}>
    <Text style={styles.headerName}>{conversation.inmateName}</Text>
    <Text style={styles.headerSub}>
      {conversation.inmateId} • {conversation.facility}
    </Text>
  </View>
</View>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={listRef}
        data={conversation.messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>
              Start the conversation by sending a message
            </Text>
          </View>
        }
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.attachButton, sending && styles.attachButtonDisabled]}
          onPress={handlePickAttachment}
          disabled={sending}
        >
          <Text style={styles.attachIcon}>📎</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#6B7280"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          editable={!sending}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1F25',
  },
  loadingText: {
    color: '#E5E7EB',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1F25',
    padding: 20,
  },
  errorText: {
    color: '#E5E7EB',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#E63946',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 25,
    padding: 10,
    marginRight: 14,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1E1F25',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B31',
  },
 
  backIcon: {
    color: '#E5E7EB',
    fontSize: 28,
    fontWeight: '300',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSub: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  messageContainerLeft: {
    justifyContent: 'flex-start',
  },
  messageContainerRight: {
    justifyContent: 'flex-end',
  },
  messageContent: {
    maxWidth: '80%',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  avatarSpacer: {
    width: 32,
    marginLeft: 8,
  },
  bubble: {
    borderRadius: 20,
    padding: 12,
    marginBottom: 2,
  },
  bubbleFamily: {
    backgroundColor: '#E63946',
    borderBottomRightRadius: 6,
  },
  bubbleInmate: {
    backgroundColor: '#2A2B31',
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 20,
  },
  bubbleTextFamily: {
    color: '#FFFFFF',
  },
  bubbleTextInmate: {
    color: '#E5E7EB',
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    
  },
  bubbleTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  statusRead: {
    color: '#34D399',
  },
  attachmentContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: screenWidth * 0.6,
    height: 200,
    borderRadius: 12,
  },
  attachmentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  attachmentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 26,
    backgroundColor: '#1E1F25',
    borderTopWidth: 1,
    borderTopColor: '#2A2B31',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2B31',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  attachButtonDisabled: {
    opacity: 0.5,
  },
  attachIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2A2B31',
    color: '#E5E7EB',
    fontSize: 16,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#4B5563',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChatScreen;