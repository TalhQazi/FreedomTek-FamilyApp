import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createFamilyRequest } from '../../src/apiClient';

const CATEGORIES = [
  'Medical Request',
  'Grievance Request',
  'General Request',
  'Supplies Request',
  'Appointment Request',
  'Custom Category',
];

const NewRequestScreen: React.FC = () => {
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim() || submitting) {
      Alert.alert('Missing information', 'Please enter a description for your request.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('familyAccessToken');
      if (!token) {
        Alert.alert('Not logged in', 'Please log in again to submit a request.');
        return;
      }

      await createFamilyRequest(token, {
        type: category,
        title: category,
        description: description.trim(),
        priority: 'normal',
      });

      Alert.alert('Submitted', 'Your request has been submitted.');
      router.replace('/requests' as never);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Request</Text>
        <Text style={styles.headerSubtitle}>
          Send a formal request to the facility on behalf of your inmate.
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.dropdown}
          activeOpacity={0.8}
          onPress={() => setShowCategories((prev) => !prev)}>
          <Text style={styles.dropdownText}>{category}</Text>
          <Text style={styles.dropdownIcon}>{showCategories ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showCategories && (
          <View style={styles.dropdownList}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.dropdownItem}
                activeOpacity={0.8}
                onPress={() => {
                  setCategory(item);
                  setShowCategories(false);
                }}>
                <Text style={styles.dropdownItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={5}
          placeholder="Describe your request in detail..."
          placeholderTextColor="#6B7280"
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity style={styles.attachButton} activeOpacity={0.8}>
          <Text style={styles.attachText}>Attach Photo (optional)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          activeOpacity={0.9}
          onPress={handleSubmit}
          disabled={submitting}>
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Text>
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
  label: {
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 6,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2B31',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  dropdownIcon: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  dropdownList: {
    backgroundColor: '#111827',
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomColor: '#1F2937',
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  textArea: {
    backgroundColor: '#2A2B31',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#E5E7EB',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  attachButton: {
    marginTop: 12,
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  attachText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default NewRequestScreen;
