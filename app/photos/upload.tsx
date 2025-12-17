import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type PhotoItem = {
  id: number;
  type: 'sent' | 'received';
  uri: string;
  time: string;
};

const UploadPhotoScreen: React.FC = () => {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos to upload.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    setImageUri(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!imageUri || saving) return;

    setSaving(true);
    try {
      const now = new Date();
      const newItem: PhotoItem = {
        id: now.getTime(),
        type: 'sent',
        uri: imageUri,
        time: now.toISOString(),
      };

      const raw = await AsyncStorage.getItem('photos');
      const existing: PhotoItem[] = raw ? JSON.parse(raw) : [];
      const updated = [newItem, ...existing];
      await AsyncStorage.setItem('photos', JSON.stringify(updated));

      router.replace('/home/photos' as never);
    } catch {
      Alert.alert('Error', 'Could not save the photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Photo</Text>
        <Text style={styles.headerSubtitle}>Share a new moment with your inmate</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.previewBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
          ) : (
            <Text style={styles.previewPlaceholder}>No image selected</Text>
          )}
        </View>

        <TouchableOpacity style={styles.pickButton} onPress={handlePickImage}>
          <Text style={styles.pickButtonText}>Pick from Gallery</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption (optional)"
          placeholderTextColor="#6B7280"
          value={caption}
          onChangeText={setCaption}
        />

        <TouchableOpacity
          style={[styles.uploadButton, (!imageUri || saving) && styles.uploadButtonDisabled]}
          disabled={!imageUri || saving}
          onPress={handleUpload}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload</Text>
          )}
        </TouchableOpacity>
      </View>
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
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  previewBox: {
    height: 260,
    borderRadius: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
  },
  pickButton: {
    backgroundColor: '#2A2B31',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickButtonText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  captionInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#2A2B31',
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#4B5563',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default UploadPhotoScreen;
