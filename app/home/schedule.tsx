import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFamilyScheduleEvents } from '../../src/apiClient';

type ScheduleEntry = {
  time: string;
  activity: string;
};

type ScheduleData = {
  morning: ScheduleEntry[];
  afternoon: ScheduleEntry[];
  evening: ScheduleEntry[];
};

const Section: React.FC<{ title: string; emoji: string; items: ScheduleEntry[] }> = ({
  title,
  emoji,
  items,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionEmoji}>{emoji}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionDivider} />

      {items.map((item, index) => (
        <View key={`${title}-${index}`} style={styles.card}>
          <Text style={styles.timeText}>{item.time}</Text>
          <Text style={styles.activityText}>{item.activity}</Text>
        </View>
      ))}
    </View>
  );
};

const HomeScheduleScreen: React.FC = () => {
  const [data, setData] = useState<ScheduleData>({
    morning: [],
    afternoon: [],
    evening: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await AsyncStorage.getItem('familyAccessToken');
        const events = await getFamilyScheduleEvents(token || undefined);

        const next: ScheduleData = {
          morning: [],
          afternoon: [],
          evening: [],
        };

        if (Array.isArray(events)) {
          events.forEach((event: any) => {
            const title = event.title || 'Scheduled activity';
            const startTime = event.startTime || event.time || event.dateTime;
            const displayTime = startTime ? new Date(startTime).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            }) : '';

            let hour = 0;
            if (startTime) {
              const d = new Date(startTime);
              if (!isNaN(d.getTime())) {
                hour = d.getHours();
              }
            }

            const entry: ScheduleEntry = {
              time: displayTime,
              activity: title,
            };

            if (hour < 12) {
              next.morning.push(entry);
            } else if (hour < 18) {
              next.afternoon.push(entry);
            } else {
              next.evening.push(entry);
            }
          });
        }

        setData(next);
      } catch (e: any) {
        console.error('Failed to load schedule', e);
        setError(e.message || 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Schedule</Text>
        <Text style={styles.headerSubtitle}>
          View your loved one's daily routine. Read-only, managed by the facility.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#E5E7EB" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Section title="Morning" emoji="🌅" items={data.morning} />
          <Section title="Afternoon" emoji="🌤" items={data.afternoon} />
          <Section title="Evening" emoji="🌙" items={data.evening} />
        </ScrollView>
      )}
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
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 14,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  sectionTitle: {
    color: '#E63946',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginTop: 6,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#2A2B31',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  activityText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HomeScheduleScreen;
