import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

const InfoScreen: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>FreedomTek Plans</Text>

        <Text style={styles.subtitle}>Choose the plan that matches how you want to use the app.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bronze - Messaging only</Text>
          <Text style={styles.cardText}>
            This plan unlocks secure messaging with your inmate.
          </Text>
          <Text style={styles.cardText}>
            With Bronze you can access:
          </Text>
          <Text style={styles.bullet}>• Messages</Text>
          <Text style={styles.bullet}>• Balance</Text>
          <Text style={styles.bullet}>• Pricing</Text>
          <Text style={styles.bullet}>• Settings & Info</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Silver - Messaging + media + requests</Text>
          <Text style={styles.cardText}>
            Everything in Bronze, plus requests and scheduling/media features.
          </Text>
          <Text style={styles.cardText}>With Silver you can access:</Text>
          <Text style={styles.bullet}>• Messages</Text>
          <Text style={styles.bullet}>• Requests</Text>
          <Text style={styles.bullet}>• Schedule</Text>
          <Text style={styles.bullet}>• Photos / media</Text>
          <Text style={styles.bullet}>• Balance, Pricing, Settings & Info</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gold - Full access</Text>
          <Text style={styles.cardText}>
            Unlock every feature in the app, including calls and advanced tools.
          </Text>
          <Text style={styles.cardText}>With Gold you can access:</Text>
          <Text style={styles.bullet}>• All messaging, media and requests</Text>
          <Text style={styles.bullet}>• Full schedule tools</Text>
          <Text style={styles.bullet}>• Calls and any advanced features</Text>
          <Text style={styles.bullet}>• Balance, Pricing, Settings & Info</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>New users</Text>
          <Text style={styles.cardText}>
            When you first sign in you can always open Balance, Pricing, Settings and this Info page.
            To unlock the rest of the app, add balance and purchase a plan from the Balance screen.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={() => router.push('/home/balance')}
        >
          <Text style={styles.primaryButtonText}>Go to Balance</Text>
        </TouchableOpacity>
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
  title: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#2A2B31',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardText: {
    color: '#D1D5DB',
    fontSize: 13,
    marginBottom: 4,
  },
  bullet: {
    color: '#9CA3AF',
    fontSize: 13,
    marginLeft: 8,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default InfoScreen;
