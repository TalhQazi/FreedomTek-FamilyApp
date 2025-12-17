import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addFamilyWalletBalance, FamilyWalletState, getFamilyWallet, selectFamilyPlan } from '../../src/apiClient';

type PlanId = 'bronze' | 'silver' | 'gold';

const HomeBalanceScreen: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
  const [addAmount, setAddAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [currentPlanPurchasedAt, setCurrentPlanPurchasedAt] = useState<string | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [isConfirmPlanModalVisible, setIsConfirmPlanModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('familyAccessToken');
      if (!token) {
        setMessage('You are not logged in.');
        return;
      }

      const wallet: FamilyWalletState = await getFamilyWallet(token);
      setBalance(wallet.balance || 0);
      setCurrentPlan(wallet.currentPlan || null);
      setCurrentPlanPurchasedAt(wallet.currentPlanPurchasedAt);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to load wallet details.');
    }
  };

  const handleAddFunds = async () => {
    const value = parseFloat(addAmount);
    if (Number.isNaN(value) || value <= 0) {
      setMessage('Please enter a valid amount to add.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('familyAccessToken');
      if (!token) {
        setMessage('You are not logged in.');
        return;
      }
      const result = await addFamilyWalletBalance(token, value);
      setBalance(result.balance ?? balance + value);
      setAddAmount('');
      setMessage('Balance added successfully.');
      setIsAddModalVisible(false);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to add balance.');
    }
  };

  const getPlanPrice = (plan: PlanId): number => {
    if (plan === 'bronze') return 29.99;
    if (plan === 'silver') return 39.99;
    return 49.99;
  };

  const handleSelectPlan = async (plan: PlanId) => {
    try {
      const token = await AsyncStorage.getItem('familyAccessToken');
      if (!token) {
        setMessage('You are not logged in.');
        return;
      }

      const wallet = await selectFamilyPlan(token, plan);
      setBalance(wallet.balance || 0);
      setCurrentPlan(wallet.currentPlan || null);
      setCurrentPlanPurchasedAt(wallet.currentPlanPurchasedAt);

      setMessage(
        `You have successfully purchased the ${
          plan.charAt(0).toUpperCase() + plan.slice(1)
        } plan.`,
      );
    } catch (error: any) {
      setMessage(error?.message || 'Unable to purchase plan.');
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const isPlanExpired = (purchasedAtIso: string): boolean => {
    const purchased = new Date(purchasedAtIso).getTime();
    if (Number.isNaN(purchased)) return true;
    const expires = purchased + 30 * 24 * 60 * 60 * 1000; // 30 days
    return Date.now() >= expires;
  };

  const getPlanExpiryInfo = () => {
    if (!currentPlan || !currentPlanPurchasedAt) return null;
    const purchased = new Date(currentPlanPurchasedAt);
    const expires = new Date(purchased.getTime() + 30 * 24 * 60 * 60 * 1000);
    const msRemaining = expires.getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    return {
      purchasedAt: purchased,
      expiresAt: expires,
      daysRemaining,
    };
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString();
  };

  const openPlanConfirmModal = (plan: PlanId) => {
    setPendingPlan(plan);
    setMessage('');
    setIsConfirmPlanModalVisible(true);
  };

  const handleConfirmPlanPurchase = async () => {
    if (!pendingPlan) return;
    await handleSelectPlan(pendingPlan);
    setPendingPlan(null);
    setIsConfirmPlanModalVisible(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance header */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          <Text style={styles.balanceCurrency}>USD</Text>

          <TouchableOpacity
            style={styles.addFundsButton}
            activeOpacity={0.9}
            onPress={() => {
              setMessage('');
              setAddAmount('');
              setIsAddModalVisible(true);
            }}>
            <Text style={styles.addFundsText}>Add Balance</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription plans table */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Plans</Text>
          <View style={styles.sectionDivider} />

          <View style={styles.planRow}>
            <View>
              <Text style={styles.planName}>Bronze</Text>
              <Text style={styles.planDescription}>Messaging only</Text>
            </View>
            <View style={styles.planActions}>
              <Text style={styles.planPrice}>$29.99/mo</Text>
              <TouchableOpacity
                style={styles.selectPlanButton}
                activeOpacity={0.9}
                onPress={() => openPlanConfirmModal('bronze')}>
                <Text style={styles.selectPlanText}>Select plan</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.planRow}>
            <View>
              <Text style={styles.planName}>Silver</Text>
              <Text style={styles.planDescription}>Messaging + media + requests</Text>
            </View>
            <View style={styles.planActions}>
              <Text style={styles.planPrice}>$39.99/mo</Text>
              <TouchableOpacity
                style={styles.selectPlanButton}
                activeOpacity={0.9}
                onPress={() => openPlanConfirmModal('silver')}>
                <Text style={styles.selectPlanText}>Select plan</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.planRow}>
            <View>
              <Text style={styles.planName}>Gold</Text>
              <Text style={styles.planDescription}>All access including legal tools and phone minutes</Text>
            </View>
            <View style={styles.planActions}>
              <Text style={styles.planPrice}>$49.99/mo</Text>
              <TouchableOpacity
                style={styles.selectPlanButton}
                activeOpacity={0.9}
                onPress={() => openPlanConfirmModal('gold')}>
                <Text style={styles.selectPlanText}>Select plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Current plan summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Your current plan</Text>
          <View style={styles.sectionDivider} />
          {currentPlan ? (
            (() => {
              const info = getPlanExpiryInfo();
              if (!info) {
                return <Text style={styles.currentPlanText}>Active plan: {currentPlan}</Text>;
              }
              return (
                <View>
                  <Text style={styles.currentPlanText}>
                    Active plan: {' '}
                    {currentPlan === 'bronze' && 'Bronze'}
                    {currentPlan === 'silver' && 'Silver'}
                    {currentPlan === 'gold' && 'Gold'}
                  </Text>
                  <Text style={styles.planMetaText}>
                    Started: {formatDate(info.purchasedAt)}
                  </Text>
                  <Text style={styles.planMetaText}>
                    Expires: {formatDate(info.expiresAt)}
                  </Text>
                  <Text style={styles.planMetaText}>
                    Days remaining: {info.daysRemaining}
                  </Text>
                </View>
              );
            })()
          ) : (
            <Text style={styles.emptyText}>No plan has been purchased yet.</Text>
          )}
        </View>

        {!!message && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}
      </ScrollView>

      {/* Add balance modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add balance</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter amount"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              value={addAmount}
              onChangeText={setAddAmount}
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setIsAddModalVisible(false);
                }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleAddFunds}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm plan purchase modal */}
      <Modal
        visible={isConfirmPlanModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsConfirmPlanModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm plan purchase</Text>
            <Text style={styles.modalBodyText}>
              Are you sure you want to buy this plan? Your previous plan will be expired.
            </Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setIsConfirmPlanModalVisible(false);
                  setPendingPlan(null);
                }}>
                <Text style={styles.modalCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleConfirmPlanPurchase}>
                <Text style={styles.modalConfirmText}>Yes, buy plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E1F25',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  balanceCard: {
    backgroundColor: '#2A2B31',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceValue: {
    color: '#E5E7EB',
    fontSize: 32,
    fontWeight: '800',
  },
  balanceCurrency: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  addFundsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#F9FAFB',
    fontSize: 14,
  },
  addFundsButton: {
    backgroundColor: '#E63946',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  addFundsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#2A2B31',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginTop: 8,
    marginBottom: 8,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  planName: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '700',
  },
  planDescription: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
    maxWidth: 220,
  },
  planPrice: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
  },
  planActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  selectPlanButton: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  selectPlanText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  currentPlanText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '700',
  },
  planMetaText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  messageBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  messageText: {
    color: '#E5E7EB',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalBodyText: {
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#F9FAFB',
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modalCancelButton: {
    backgroundColor: '#374151',
  },
  modalConfirmButton: {
    backgroundColor: '#E63946',
  },
  modalCancelText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default HomeBalanceScreen;
