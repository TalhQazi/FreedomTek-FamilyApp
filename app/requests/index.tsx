import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getFamilyRequests } from '../../src/apiClient';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'In Progress';

export type RequestItem = {
  id: string; // backend _id
  category: string;
  description: string;
  status: RequestStatus;
  date: string; // ISO string
  reply: string;
};

const RequestsListScreen: React.FC = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const token = await AsyncStorage.getItem('familyAccessToken');
      if (!token) {
        setRequests([]);
        return;
      }

      const backendRequests = await getFamilyRequests(token);

      const mapped: RequestItem[] = Array.isArray(backendRequests)
        ? backendRequests.map((r: any) => {
            let status: RequestStatus = 'Pending';
            if (r.status === 'approved') status = 'Approved';
            else if (r.status === 'rejected') status = 'Rejected';
            else if (r.status === 'in_progress') status = 'In Progress';

            return {
              id: String(r._id),
              category: r.type || 'General Request',
              description: r.description || r.title || '',
              status,
              date: r.createdAt || new Date().toISOString(),
              reply: '',
            };
          })
        : [];

      const sorted = [...mapped].sort((a, b) => (a.date > b.date ? -1 : 1));
      setRequests(sorted);
    } catch (error: any) {
      console.error('Failed to load family requests', error);
      Alert.alert('Error', error.message || 'Failed to load requests');
      setRequests([]);
    }
  };

  const handleNewRequest = () => {
    router.push('/requests/new' as never);
  };

  const handleOpenDetails = (request: RequestItem) => {
    router.push({
      pathname: '/requests/details',
      params: {
        id: request.id,
        category: request.category,
        description: request.description,
        status: request.status,
        date: request.date,
      },
    } as never);
  };

  const statusColor = (status: RequestStatus) => {
    switch (status) {
      case 'Approved':
        return '#10B981';
      case 'Rejected':
        return '#EF4444';
      case 'In Progress':
        return '#3B82F6';
      case 'Pending':
      default:
        return '#FBBF24';
    }
  };

  const renderItem = ({ item }: { item: RequestItem }) => {
    const date = new Date(item.date);
    const displayDate = isNaN(date.getTime())
      ? item.date
      : date.toLocaleDateString();

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handleOpenDetails(item)}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.dateText}>{displayDate}</Text>
        </View>

        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooterRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.arrowText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Requests</Text>
          <Text style={styles.headerSubtitle}>Track your formal facility requests</Text>
        </View>
        <TouchableOpacity
          style={styles.newButton}
          activeOpacity={0.9}
          onPress={handleNewRequest}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={
          requests.length === 0 ? styles.emptyContent : styles.listContent
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No requests yet</Text>
            <Text style={styles.emptyText}>
              Start by creating a new request to the facility on behalf of your inmate.
            </Text>
          </View>
        }
      />
    </View>
  );
};

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
  categoryBadge: {
    backgroundColor: '#E63946',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  descriptionText: {
    color: '#E5E7EB',
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
  arrowText: {
    color: '#9CA3AF',
    fontSize: 20,
    fontWeight: '600',
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
});

export default RequestsListScreen;
