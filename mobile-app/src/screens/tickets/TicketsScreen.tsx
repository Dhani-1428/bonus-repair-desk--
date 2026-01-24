import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function TicketsScreen({ navigation }: any) {
  const { user } = useAuth();
  const theme = useTheme();
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, [user]);

  useEffect(() => {
    filterTickets();
  }, [searchQuery, filterStatus, tickets]);

  const loadTickets = async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getTickets(user.id);
      const ticketsData = response.tickets || [];
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      Alert.alert('Error', 'Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.customerName?.toLowerCase().includes(query) ||
          ticket.repairNumber?.toLowerCase().includes(query) ||
          ticket.brand?.toLowerCase().includes(query) ||
          ticket.model?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter((ticket) => ticket.status === filterStatus);
    }

    setFilteredTickets(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const handleDelete = (ticketId: string) => {
    Alert.alert(
      'Delete Ticket',
      'Are you sure you want to delete this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTicket(ticketId);
              loadTickets();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete ticket');
            }
          },
        },
      ]
    );
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tickets..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === null && styles.filterButtonActive]}
          onPress={() => setFilterStatus(null)}
        >
          <Text style={[styles.filterText, filterStatus === null && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('pending')}
        >
          <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'in_progress' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('in_progress')}
        >
          <Text style={[styles.filterText, filterStatus === 'in_progress' && styles.filterTextActive]}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.ticketCard}
            onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
          >
            <View style={styles.ticketHeader}>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketNumber}>{item.repairNumber || item.id}</Text>
                <Text style={styles.ticketCustomer}>{item.customerName || 'N/A'}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === 'completed'
                        ? theme.colors.success + '20'
                        : item.status === 'pending'
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
                        item.status === 'completed'
                          ? theme.colors.success
                          : item.status === 'pending'
                          ? theme.colors.warning
                          : theme.colors.secondary,
                    },
                  ]}
                >
                  {item.status || 'pending'}
                </Text>
              </View>
            </View>
            <Text style={styles.ticketDevice}>
              {item.brand} {item.model}
            </Text>
            <View style={styles.ticketFooter}>
              <Text style={styles.ticketDate}>
                {format(new Date(item.createdAt), 'MMM dd, yyyy')}
              </Text>
              <Text style={styles.ticketPrice}>${parseFloat(item.price || 0).toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No tickets found</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTicket')}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchIcon: {
      marginRight: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      height: 44,
      color: theme.colors.text,
      fontSize: 16,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    filterButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    filterTextActive: {
      color: '#ffffff',
    },
    listContent: {
      padding: theme.spacing.md,
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
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    ticketInfo: {
      flex: 1,
    },
    ticketNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    ticketCustomer: {
      fontSize: 14,
      color: theme.colors.textSecondary,
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
    ticketDevice: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      fontWeight: '500',
    },
    ticketFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ticketDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    ticketPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
      marginTop: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
    fab: {
      position: 'absolute',
      right: theme.spacing.lg,
      bottom: theme.spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
  });
