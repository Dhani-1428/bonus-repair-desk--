import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, [user]);

  const loadSubscriptions = async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getSubscriptions(user.id);
      setSubscriptions(response.subscriptions || response.payments || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubscriptions();
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Subscription</Text>
        <Text style={styles.subtitle}>Manage your subscription plans</Text>
      </View>

      {subscriptions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="card-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>No active subscription</Text>
          <Text style={styles.emptySubtext}>
            Subscribe to a plan to access all features
          </Text>
        </View>
      ) : (
        subscriptions.map((subscription) => (
          <View key={subscription.id} style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View>
                <Text style={styles.planName}>{subscription.planName || subscription.plan}</Text>
                <Text style={styles.planDuration}>
                  {subscription.months} month{subscription.months > 1 ? 's' : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      subscription.status === 'active'
                        ? theme.colors.success + '20'
                        : subscription.status === 'expired'
                        ? theme.colors.error + '20'
                        : theme.colors.warning + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        subscription.status === 'active'
                          ? theme.colors.success
                          : subscription.status === 'expired'
                          ? theme.colors.error
                          : theme.colors.warning,
                    },
                  ]}
                >
                  {subscription.status || 'pending'}
                </Text>
              </View>
            </View>

            <View style={styles.subscriptionDetails}>
              <DetailRow label="Price" value={`$${parseFloat(subscription.price || 0).toFixed(2)}`} />
              {subscription.startDate && (
                <DetailRow
                  label="Start Date"
                  value={format(new Date(subscription.startDate), 'MMM dd, yyyy')}
                />
              )}
              {subscription.endDate && (
                <DetailRow
                  label="End Date"
                  value={format(new Date(subscription.endDate), 'MMM dd, yyyy')}
                />
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const rowStyles = createStyles(theme);
  return (
    <View style={rowStyles.detailRow}>
      <Text style={rowStyles.detailLabel}>{label}</Text>
      <Text style={rowStyles.detailValue}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
      marginTop: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 18,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      fontWeight: '600',
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
    },
    subscriptionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    subscriptionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.md,
    },
    planName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    planDuration: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    subscriptionDetails: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
  });
