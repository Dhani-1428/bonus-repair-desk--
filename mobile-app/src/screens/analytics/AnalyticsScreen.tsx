import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  // Refresh when screen comes into focus to sync changes from web
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAnalytics();
    });
    return unsubscribe;
  }, [navigation, user]);

  const loadAnalytics = async () => {
    if (!user?.id) return;

    try {
      // For now, calculate analytics from tickets
      const response = await apiService.getTickets(user.id);
      const tickets = response.tickets || [];

      // Calculate analytics (case-insensitive status matching)
      const totalTickets = tickets.length;
      const completedTickets = tickets.filter((t: any) => (t.status || '').toLowerCase() === 'completed').length;
      const pendingTickets = tickets.filter((t: any) => {
        const status = (t.status || '').toLowerCase();
        return status === 'pending' || status === 'in_progress';
      }).length;
      const inProgressTickets = tickets.filter((t: any) => (t.status || '').toLowerCase() === 'in_progress').length;
      const deliveredTickets = tickets.filter((t: any) => (t.status || '').toLowerCase() === 'delivered').length;
      const cancelledTickets = tickets.filter((t: any) => (t.status || '').toLowerCase() === 'cancelled').length;
      const cannotRepairedTickets = tickets.filter((t: any) => (t.status || '').toLowerCase() === 'cannot_repaired').length;
      const notOkTickets = tickets.filter((t: any) => (t.status || '').toLowerCase() === 'not_ok').length;
      const outTickets = tickets.filter((t: any) => (t.status || '').toLowerCase() === 'out').length;
      
      const totalRevenue = tickets
        .filter((t: any) => (t.status || '').toLowerCase() === 'completed')
        .reduce((sum: number, t: any) => sum + (parseFloat(t.price || t.budget || 0) || 0), 0);
      const averageTicketValue = completedTickets > 0 ? totalRevenue / completedTickets : 0;

      setAnalytics({
        totalTickets,
        completedTickets,
        pendingTickets,
        inProgressTickets,
        deliveredTickets,
        cancelledTickets,
        cannotRepairedTickets,
        notOkTickets,
        outTickets,
        totalRevenue,
        averageTicketValue,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
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
      contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('analytics.overview')}</Text>
        <Text style={styles.subtitle}>{t('analytics.subtitle')}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="document-text"
          label={t('analytics.totalTickets')}
          value={analytics?.totalTickets || 0}
          color={theme.colors.primary}
          onPress={() => navigation.navigate('DeviceList', {
            filterType: 'all',
            title: t('analytics.totalTickets'),
          })}
        />
        <StatCard
          icon="checkmark-circle"
          label={t('analytics.completed')}
          value={analytics?.completedTickets || 0}
          color={theme.colors.success}
          onPress={() => navigation.navigate('DeviceList', {
            filterType: 'status',
            filterValue: 'completed',
            title: t('analytics.completed'),
          })}
        />
        <StatCard
          icon="time-outline"
          label={t('analytics.pending')}
          value={analytics?.pendingTickets || 0}
          color={theme.colors.warning}
          onPress={() => navigation.navigate('DeviceList', {
            filterType: 'status',
            filterValue: 'pending',
            title: t('analytics.pending'),
          })}
        />
        <StatCard
          icon="hourglass-outline"
          label={t('analytics.inProgress')}
          value={analytics?.inProgressTickets || 0}
          color={theme.colors.secondary}
          onPress={() => navigation.navigate('DeviceList', {
            filterType: 'status',
            filterValue: 'in_progress',
            title: t('analytics.inProgress'),
          })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('analytics.revenue')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('DeviceList', {
            filterType: 'revenue',
            title: t('analytics.totalRevenue'),
          })}
        >
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>{t('analytics.totalRevenue')}</Text>
            <Text style={styles.revenueValue}>
              €{analytics?.totalRevenue.toFixed(2) || '0.00'}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>{t('analytics.averageTicketValue')}</Text>
          <Text style={styles.revenueValue}>
            €{analytics?.averageTicketValue.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('analytics.performanceMetrics')}</Text>
        <MetricRow
          label={t('analytics.completionRate')}
          value={`${analytics?.totalTickets > 0 ? ((analytics.completedTickets / analytics.totalTickets) * 100).toFixed(1) : 0}%`}
        />
        <MetricRow
          label={t('analytics.pendingRate')}
          value={`${analytics?.totalTickets > 0 ? ((analytics.pendingTickets / analytics.totalTickets) * 100).toFixed(1) : 0}%`}
        />
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, onPress }: { icon: string; label: string; value: number; color: string; onPress?: () => void }) {
  const theme = useTheme();
  const cardStyles = createStyles(theme);
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={cardStyles.statCardWrapper}>
        <View style={cardStyles.statCard}>
          <Ionicons name={icon as any} size={32} color={color} />
          <Text style={cardStyles.statValue}>{value}</Text>
          <Text style={cardStyles.statLabel}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={cardStyles.statCard}>
      <Ionicons name={icon as any} size={32} color={color} />
      <Text style={cardStyles.statValue}>{value}</Text>
      <Text style={cardStyles.statLabel}>{label}</Text>
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const rowStyles = createStyles(theme);
  return (
    <View style={rowStyles.metricRow}>
      <Text style={rowStyles.metricLabel}>{label}</Text>
      <Text style={rowStyles.metricValue}>{value}</Text>
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
      paddingHorizontal: 24,
      paddingVertical: theme.spacing.lg,
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
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      marginBottom: theme.spacing.lg,
    },
    statCardWrapper: {
      width: '48%',
      marginRight: '2%',
      marginBottom: theme.spacing.md,
    },
    statCard: {
      width: '100%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: theme.spacing.lg,
      marginTop: theme.spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    revenueCard: {
      backgroundColor: '#2a2a2a',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    revenueLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    revenueValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    metricLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    metricValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
  });
