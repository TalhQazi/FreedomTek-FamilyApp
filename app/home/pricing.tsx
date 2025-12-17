import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { getPublicPricing } from '../../src/apiClient';

interface PublicPricing {
  tabletAndroidMonthly: number;
  tabletIosMonthly: number;
  bronzeMonthly: number;
  silverMonthly: number;
  goldMonthly: number;
  moviePrice: number;
  gamePrice: number;
  songPrice: number;
  creditsNote: string;
  loadFee: number;
}

const PricingScreen: React.FC = () => {
  const [pricing, setPricing] = useState<PublicPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const data = await getPublicPricing();
        setPricing(data);
      } catch (e: any) {
        setError(e?.message || 'Unable to load pricing');
      } finally {
        setLoading(false);
      }
    };

    loadPricing();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#E63946" />
        <Text style={styles.loadingText}>Loading pricing...</Text>
      </View>
    );
  }

  if (error || !pricing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Pricing not available'}</Text>
      </View>
    );
  }

  const format = (v: number) => `$${v.toFixed(2)}`;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Pricing & Plans</Text>
        <Text style={styles.subtitle}>
          These prices are managed by the facility and may change over time.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tablet Rental</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Android tablet (monthly)</Text>
            <Text style={styles.value}>{format(pricing.tabletAndroidMonthly)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>iOS tablet (monthly)</Text>
            <Text style={styles.value}>{format(pricing.tabletIosMonthly)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Membership Plans</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Bronze (monthly)</Text>
            <Text style={styles.value}>{format(pricing.bronzeMonthly)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Silver (monthly)</Text>
            <Text style={styles.value}>{format(pricing.silverMonthly)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gold (monthly)</Text>
            <Text style={styles.value}>{format(pricing.goldMonthly)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>A la carte</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Movie</Text>
            <Text style={styles.value}>{format(pricing.moviePrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Game</Text>
            <Text style={styles.value}>{format(pricing.gamePrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Song</Text>
            <Text style={styles.value}>{format(pricing.songPrice)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wallet & Credits</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Wallet load fee</Text>
            <Text style={styles.value}>{format(pricing.loadFee)}</Text>
          </View>
          {!!pricing.creditsNote && (
            <Text style={styles.note}>{pricing.creditsNote}</Text>
          )}
        </View>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1F25',
  },
  loadingText: {
    marginTop: 8,
    color: '#E5E7EB',
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: '#E5E7EB',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  value: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 13,
  },
});

export default PricingScreen;
