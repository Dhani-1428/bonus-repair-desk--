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

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalTickets: 0,
    pendingTickets: 0,
    completedTickets: 0,
    totalRevenue: 0,
  });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      const [ticketsResponse] = await Promise.all([
        apiService.getTickets(user.id),
      ]);

      const tickets = ticketsResponse.tickets || [];
      
      // Calculate stats
      const totalTickets = tickets.length;
      const pendingTickets = tickets.filter((t: any) => 
        t.status === 'pending' || t.status === 'in_progress'
      ).length;
      const completedTickets = tickets.filter((t: any) => 
        t.status === 'completed'
      ).length;
      const totalRevenue = tickets
        .filter((t: any) => t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (parseFloat(t.price) || 0), 0);

      setStats({
        totalTickets,
        pendingTickets,
        completedTickets,
        totalRevenue,
      });

      // Get recent tickets (last 5)
      const sortedTickets = [...tickets]
        .sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);
      
      setRecentTickets(sortedTickets);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
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
        <Text style={styles.greeting}>Welcome back, {user?.name}!</Text>
        <Text style={styles.subtitle}>Here's what's happening</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={24} color={theme.colors.primary} />
          <Text style={styles.statValue}>{stats.totalTickets}</Text>
          <Text style={styles.statLabel}>Total Tickets</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color={theme.colors.warning} />
          <Text style={styles.statValue}>{stats.pendingTickets}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
          <Text style={styles.statValue}>{stats.completedTickets}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color={theme.colors.secondary} />
          <Text style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tickets</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tickets')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No tickets yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateTicket')}
            >
              <Text style={styles.createButtonText}>Create First Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentTickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketCard}
              onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })}
            >
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketNumber}>{ticket.repairNumber || ticket.id}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        ticket.status === 'completed'
                          ? theme.colors.success + '20'
                          : ticket.status === 'pending'
                          ? theme.colors.warning + '20'
                          : theme.colors.secondary + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          ticket.status === 'completed'
                            ? theme.colors.success
                            : ticket.status === 'pending'
                            ? theme.colors.warning
                            : theme.colors.secondary,
                      },
                    ]}
                  >
                    {ticket.status || 'pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.ticketCustomer}>{ticket.customerName || 'N/A'}</Text>
              <Text style={styles.ticketDevice}>
                {ticket.brand} {ticket.model}
              </Text>
              <Text style={styles.ticketDate}>
                {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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
      paddingBottom: theme.spacing.md,
    },
    greeting: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    statsContainer: {
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
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    section: {
      padding: theme.spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    seeAll: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    createButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    ticketCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    ticketHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    ticketNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    ticketCustomer: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    ticketDevice: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    ticketDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });
