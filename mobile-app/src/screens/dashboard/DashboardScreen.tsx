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
import { BlurView } from 'expo-blur';

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
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.blurHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name}!</Text>
          </View>
          <Ionicons name="notifications-outline" size={28} color={theme.colors.primary} />
        </View>
        <Text style={styles.subtitle}>Here's what's happening</Text>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.statsContainer}>
          <BlurView intensity={60} tint="dark" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="document-text" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalTickets}</Text>
            <Text style={styles.statLabel}>Total Tickets</Text>
          </BlurView>

          <BlurView intensity={60} tint="dark" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="time-outline" size={28} color={theme.colors.warning} />
            </View>
            <Text style={styles.statValue}>{stats.pendingTickets}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </BlurView>

          <BlurView intensity={60} tint="dark" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={28} color={theme.colors.success} />
            </View>
            <Text style={styles.statValue}>{stats.completedTickets}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </BlurView>

          <BlurView intensity={60} tint="dark" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.secondary + '20' }]}>
              <Ionicons name="cash" size={28} color={theme.colors.secondary} />
            </View>
            <Text style={styles.statValue}>€{stats.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </BlurView>
        </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tickets</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tickets')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTickets.length === 0 ? (
          <BlurView intensity={60} tint="dark" style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No tickets yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateTicket')}
            >
              <Text style={styles.createButtonText}>Create First Ticket</Text>
            </TouchableOpacity>
          </BlurView>
        ) : (
          recentTickets.map((ticket) => (
            <BlurView key={ticket.id} intensity={60} tint="dark" style={styles.ticketCardWrapper}>
            <TouchableOpacity
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
            </BlurView>
          ))
        )}
      </View>
      </ScrollView>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    greeting: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    userName: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 12,
    },
    statCard: {
      width: '48%',
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    statIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    section: {
      marginTop: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 22,
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
      padding: 40,
      marginTop: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emptyText: {
      fontSize: 18,
      color: theme.colors.text,
      marginTop: 16,
      fontWeight: '600',
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 16,
    },
    createButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    ticketCardWrapper: {
      marginBottom: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      overflow: 'hidden',
    },
    ticketCard: {
      padding: 20,
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
