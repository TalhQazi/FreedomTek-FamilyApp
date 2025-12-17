import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type PhotoItem = {
  id: number;
  type: 'sent' | 'received';
  uri: string;
  time: string;
};

const HomePhotosScreen: React.FC = () => {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setRefreshing(true);
    try {
      const raw = await AsyncStorage.getItem('photos');
      const parsed: PhotoItem[] = raw ? JSON.parse(raw) : [];
      const sorted = [...parsed].sort((a, b) => (a.time > b.time ? -1 : 1));
      setPhotos(sorted);
    } catch {
      setPhotos([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenUpload = () => {
    router.push('/photos/upload' as never);
  };

  const handleOpenPhoto = (id: number) => {
    router.push({ pathname: '/photos/view', params: { id: String(id) } } as never);
  };

  const renderItem = ({ item }: { item: PhotoItem }) => {
    return (
      <TouchableOpacity
        style={styles.thumbWrapper}
        activeOpacity={0.8}
        onPress={() => handleOpenPhoto(item.id)}>
        <Image source={{ uri: item.uri }} style={styles.thumbImage} contentFit="cover" />
        {item.type === 'sent' && (
          <View style={styles.badgeSent}>
            <Text style={styles.badgeText}>You</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Photos</Text>
        <Text style={styles.headerSubtitle}>Shared moments with your loved one</Text>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPhotos}
            tintColor="#E5E7EB"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptyText}>
              Start by uploading a photo to share with your inmate.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={handleOpenUpload}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
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
    color: '#E5E7EB',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  gridContent: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  thumbWrapper: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111827',
    marginBottom: 8,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  badgeSent: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
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
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
  },
});

export default HomePhotosScreen;
