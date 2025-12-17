import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const FAMILY_MEMBERS = [
  { id: '1', name: 'Ali', relation: 'Father', age: 42 },
  { id: '2', name: 'Sara', relation: 'Mother', age: 39 },
  { id: '3', name: 'Hamza', relation: 'Son', age: 14 },
  { id: '4', name: 'Ayesha', relation: 'Daughter', age: 10 },
];

const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>FreedomTek Family App</Text>
      <Text style={styles.subtitle}>Your simple family dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Family Members</Text>
        <FlatList
          data={FAMILY_MEMBERS}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.relation}>{item.relation}</Text>
              </View>
              <Text style={styles.age}>{item.age} yrs</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  relation: {
    fontSize: 13,
    color: '#777',
  },
  age: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});

export default HomeScreen;
