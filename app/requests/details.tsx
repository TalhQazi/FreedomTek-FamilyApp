import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RequestStatus } from './index';

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

const RequestDetailsScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    category?: string;
    description?: string;
    status?: string;
    date?: string;
  }>();

  const requestStatus = (params.status as RequestStatus) || 'Pending';
  const date = params.date ? new Date(params.date) : new Date();
  const displayDate = isNaN(date.getTime()) ? params.date || '' : date.toLocaleString();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIconWrapper}>
          <Text style={styles.backIcon}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.rowBetween}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{params.category || 'Request'}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor(requestStatus) }]}>
            <Text style={styles.statusText}>{requestStatus}</Text>
          </View>
        </View>

        <Text style={styles.metaText}>ID: {params.id}</Text>
        <Text style={styles.metaText}>Date: {displayDate}</Text>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.bodyText}>{params.description}</Text>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Reply</Text>
        <Text style={styles.noReplyText}>(No reply yet)</Text>
      </View>
    </View>
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
  errorText: {
    color: '#E5E7EB',
    fontSize: 16,
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: '#E63946',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1E1F25',
  },
  backIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#E5E7EB',
    fontSize: 22,
  },
  headerTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#E63946',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  bodyText: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
  },
  replyBox: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
  },
  replyText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  noReplyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default RequestDetailsScreen;
