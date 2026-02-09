import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

const getPlans = (t: (key: string) => string) => [
  {
    id: 'SIX_MONTH',
    name: t('subscription.plan.professional'),
    price: 100,
    months: 6,
    period: t('subscription.plan.6months'),
    popular: true,
    features: [
      t('subscription.feature.everythingStarter'),
      t('subscription.feature.advancedAnalytics'),
      t('subscription.feature.prioritySupport'),
      t('subscription.feature.customReports'),
      t('subscription.feature.apiAccess'),
      t('subscription.feature.dataExport'),
    ],
  },
  {
    id: 'TWELVE_MONTH',
    name: t('subscription.plan.enterprise'),
    price: 150,
    months: 12,
    period: t('subscription.plan.12months'),
    popular: false,
    features: [
      t('subscription.feature.everythingProfessional'),
      t('subscription.feature.unlimitedTickets'),
      t('subscription.feature.dedicatedSupport'),
      t('subscription.feature.customIntegrations'),
      t('subscription.feature.whiteLabel'),
      t('subscription.feature.advancedSecurity'),
    ],
  },
];

export default function BuySubscriptionScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { t, language } = useLanguage();
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  
  // Recalculate plans when language changes
  const PLANS = useMemo(() => getPlans(t), [t, language]);

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const getPlanTranslation = (planId: string) => {
    const planMap: Record<string, string> = {
      'SIX_MONTH': t('subscription.plan.6months'),
      'TWELVE_MONTH': t('subscription.plan.12months'),
    };
    return planMap[planId] || planId;
  };

  const getStatusTranslation = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'active') {
      return t('subscription.active');
    } else if (statusLower === 'expired') {
      return t('subscription.expired') || 'Expired';
    } else if (statusLower === 'pending') {
      return t('common.status') + ': ' + (t('ticket.status.pending') || 'Pending');
    }
    return status;
  };

  const loadSubscription = async () => {
    if (!user?.id) return;
    try {
      const data = await apiService.getSubscriptions(user.id);
      if (data.subscription) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan || !user?.id) return;

    setLoading(true);
    try {
      const plan = PLANS.find((p) => p.id === selectedPlan);
      if (!plan) throw new Error('Invalid plan');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + plan.months);
      endDate.setHours(23, 59, 59, 999);

      await apiService.createPayment({
        userId: user.id,
        plan: selectedPlan,
        planName: plan.name,
        price: plan.price,
        months: plan.months,
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
      });

      Alert.alert(
        t('subscription.paymentSubmitted'),
        t('subscription.paymentSubmittedMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setShowPaymentModal(false);
              setSelectedPlan(null);
              loadSubscription();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('subscription.paymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);
  const selectedPlanData = selectedPlan ? PLANS.find((p) => p.id === selectedPlan) : null;

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.blurHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('page.subscription.title')}</Text>
            <Text style={styles.subtitle}>{t('page.subscription.subtitle')}</Text>
          </View>
          <Ionicons name="card-outline" size={32} color={theme.colors.primary} />
        </View>
      </BlurView>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {subscription && (
          <BlurView intensity={60} tint="dark" style={styles.currentSubscriptionCard}>
            <View style={styles.currentSubscriptionHeader}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.currentSubscriptionTitle}>{t('subscription.current')}</Text>
            </View>
            <Text style={styles.currentSubscriptionPlan}>
              {subscription.planName || getPlanTranslation(subscription.plan)}
            </Text>
            <Text style={styles.currentSubscriptionStatus}>
              {getStatusTranslation(subscription.status)}
            </Text>
          </BlurView>
        )}

        <Text style={styles.sectionTitle}>{t('subscription.availablePlans')}</Text>

        {PLANS.map((plan) => (
          <BlurView key={plan.id} intensity={60} tint="dark" style={styles.planCard}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>{t('subscription.mostPopular')}</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>€{plan.price}</Text>
                <Text style={styles.pricePeriod}>/{plan.period}</Text>
              </View>
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                plan.popular && styles.subscribeButtonPopular,
              ]}
              onPress={() => handleSelectPlan(plan.id)}
            >
              <Text style={styles.subscribeButtonText}>{t('subscription.subscribeNow')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </BlurView>
        ))}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <BlurView intensity={100} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('subscription.mbwayPayment')}</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedPlanData && (
              <>
                <View style={styles.paymentInfo}>
                  <View style={styles.paymentRow}>
                    <Ionicons name="phone-portrait-outline" size={20} color={theme.colors.primary} />
                    <View style={styles.paymentRowContent}>
                      <Text style={styles.paymentLabel}>{t('subscription.mbwayNumber')}</Text>
                      <Text style={styles.paymentValue}>+351920306889</Text>
                    </View>
                  </View>

                  <View style={styles.paymentRow}>
                    <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                    <View style={styles.paymentRowContent}>
                      <Text style={styles.paymentLabel}>{t('subscription.recipientName')}</Text>
                      <Text style={styles.paymentValue}>Sheetal Sheetal</Text>
                    </View>
                  </View>

                  <View style={styles.paymentRow}>
                    <Ionicons name="cash-outline" size={20} color={theme.colors.primary} />
                    <View style={styles.paymentRowContent}>
                      <Text style={styles.paymentLabel}>{t('subscription.amount')}</Text>
                      <Text style={styles.paymentValueAmount}>€{selectedPlanData.price}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalWarning}>
                  <Ionicons name="information-circle-outline" size={20} color={theme.colors.warning} />
                  <Text style={styles.modalWarningText}>
                    {t('subscription.paymentWarning')}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowPaymentModal(false)}
                  >
                    <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={handleConfirmPayment}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.modalConfirmText}>{t('subscription.confirmPayment')}</Text>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </BlurView>
        </BlurView>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    blurHeader: {
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 24,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    currentSubscriptionCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    currentSubscriptionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    currentSubscriptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    currentSubscriptionPlan: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    currentSubscriptionStatus: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    planCard: {
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      position: 'relative',
    },
    popularBadge: {
      position: 'absolute',
      top: -12,
      alignSelf: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
    },
    popularText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
      marginTop: 8,
    },
    planName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    planPeriod: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    priceContainer: {
      alignItems: 'flex-end',
    },
    price: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    pricePeriod: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    featuresContainer: {
      marginBottom: 24,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    featureText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    subscribeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
    },
    subscribeButtonPopular: {
      backgroundColor: theme.colors.primary,
    },
    subscribeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    paymentInfo: {
      marginBottom: 24,
    },
    paymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    paymentRowContent: {
      flex: 1,
    },
    paymentLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    paymentValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    paymentValueAmount: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    modalWarning: {
      flexDirection: 'row',
      backgroundColor: theme.colors.warning + '20',
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      gap: 12,
    },
    modalWarningText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.warning,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    modalCancelText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    modalConfirmButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.success,
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
    },
    modalConfirmText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
