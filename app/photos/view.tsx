import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

const ViewPhotoScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [photo, setPhoto] = useState<PhotoItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhoto = async () => {
      try {
        const raw = await AsyncStorage.getItem('photos');
        const all: PhotoItem[] = raw ? JSON.parse(raw) : [];
        const numericId = Number(id);
        const found = all.find((p) => p.id === numericId) || null;
        setPhoto(found);
      } catch {
        setPhoto(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPhoto();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!photo) return;

    Alert.alert('Delete photo', 'Are you sure you want to remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem('photos');
            const all: PhotoItem[] = raw ? JSON.parse(raw) : [];
            const remaining = all.filter((p) => p.id !== photo.id);
            await AsyncStorage.setItem('photos', JSON.stringify(remaining));
          } catch {
            // ignore
          } finally {
            router.back();
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  if (!photo) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Photo not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Text style={styles.iconText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Photo</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
          <Text style={styles.iconText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(15,23,42,0.9)',
  },
  topTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    padding: 6,
  },
  iconText: {
    color: '#E5E7EB',
    fontSize: 20,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ViewPhotoScreen;
