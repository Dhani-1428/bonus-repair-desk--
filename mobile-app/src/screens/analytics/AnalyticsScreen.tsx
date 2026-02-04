import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user?.id) return;

    try {
      // For now, calculate analytics from tickets
      const response = await apiService.getTickets(user.id);
      const tickets = response.tickets || [];

      // Calculate analytics
      const totalTickets = tickets.length;
      const completedTickets = tickets.filter((t: any) => t.status === 'completed').length;
      const pendingTickets = tickets.filter((t: any) => t.status === 'pending').length;
      const inProgressTickets = tickets.filter((t: any) => t.status === 'in_progress').length;
      const totalRevenue = tickets
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (parseFloat(t.price) || 0), 0);
      const averageTicketValue = completedTickets > 0 ? totalRevenue / completedTickets : 0;

      setAnalytics({
        totalTickets,
        completedTickets,
        pendingTickets,
        inProgressTickets,
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Overview</Text>
        <Text style={styles.subtitle}>Your business insights</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="document-text"
          label="Total Tickets"
          value={analytics?.totalTickets || 0}
          color={theme.colors.primary}
        />
        <StatCard
          icon="checkmark-circle"
          label="Completed"
          value={analytics?.completedTickets || 0}
          color={theme.colors.success}
        />
        <StatCard
          icon="time-outline"
          label="Pending"
          value={analytics?.pendingTickets || 0}
          color={theme.colors.warning}
        />
        <StatCard
          icon="hourglass-outline"
          label="In Progress"
          value={analytics?.inProgressTickets || 0}
          color={theme.colors.secondary}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue</Text>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <Text style={styles.revenueValue}>
            ${analytics?.totalRevenue.toFixed(2) || '0.00'}
          </Text>
        </View>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Average Ticket Value</Text>
          <Text style={styles.revenueValue}>
            ${analytics?.averageTicketValue.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <MetricRow
          label="Completion Rate"
          value={`${analytics?.totalTickets > 0 ? ((analytics.completedTickets / analytics.totalTickets) * 100).toFixed(1) : 0}%`}
        />
        <MetricRow
          label="Pending Rate"
          value={`${analytics?.totalTickets > 0 ? ((analytics.pendingTickets / analytics.totalTickets) * 100).toFixed(1) : 0}%`}
        />
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const theme = useTheme();
  const cardStyles = createStyles(theme);
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
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      marginRight: '2%',
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
      padding: theme.spacing.lg,
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
