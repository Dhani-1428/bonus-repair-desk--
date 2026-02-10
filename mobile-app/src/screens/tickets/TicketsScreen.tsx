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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { printTicket } from '../../services/printService';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { BlurView } from 'expo-blur';

export default function TicketsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [printing, setPrinting] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, [user]);

  // Refresh when screen comes into focus to sync changes from web
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTickets();
    });
    return unsubscribe;
  }, [navigation, user]);

  const handlePrint = async (ticket: any) => {
    try {
      setPrinting(ticket.id);
      await printTicket(ticket);
    } catch (error: any) {
      console.error('Error printing:', error);
      Alert.alert(t('common.error'), error.message || t('common.printFailed'));
    } finally {
      setPrinting(null);
    }
  };

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
      Alert.alert(t('common.error'), t('error.loadTicketsFailed') || 'Failed to load tickets');
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

    // Filter by status (case-insensitive)
    if (filterStatus) {
      filtered = filtered.filter((ticket) => {
        const ticketStatus = (ticket.status || '').toLowerCase();
        const filterStatusLower = filterStatus.toLowerCase();

        if (filterStatusLower === 'pending') {
          return ticketStatus === 'pending' || ticketStatus === 'in_progress';
        }
        return ticketStatus === filterStatusLower;
      });
    }

    setFilteredTickets(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const getStatusTranslation = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'ticket.status.pending',
      'in_progress': 'ticket.status.in_progress',
      'completed': 'ticket.status.completed',
      'delivered': 'ticket.status.delivered',
      'cancelled': 'ticket.status.cancelled',
      'cannot_repaired': 'ticket.status.cannot_repaired',
      'out': 'ticket.status.out',
      'not_ok': 'ticket.status.not_ok',
    };
    return t(statusMap[status?.toLowerCase()] || 'ticket.status.pending');
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'completed') {
      return theme.colors.success;
    } else if (statusLower === 'pending' || statusLower === 'in_progress') {
      return theme.colors.warning;
    } else if (statusLower === 'cannot_repaired' || statusLower === 'not_ok' || statusLower === 'cancelled') {
      return theme.colors.error;
    } else if (statusLower === 'delivered' || statusLower === 'out') {
      return theme.colors.secondary;
    }
    return theme.colors.warning;
  };

  const handleDelete = (ticketId: string) => {
    Alert.alert(
      t('ticket.delete'),
      t('common.deleteConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTicket(ticketId);
              loadTickets();
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('common.deleteFailed'));
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
          placeholder={t('tickets.searchPlaceholder')}
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
          <Text style={[styles.filterText, filterStatus === null && styles.filterTextActive]}>
            {t('tickets.filterAll')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('pending')}
        >
          <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>
            {getStatusTranslation('pending')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'in_progress' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('in_progress')}
        >
          <Text style={[styles.filterText, filterStatus === 'in_progress' && styles.filterTextActive]}>
            {getStatusTranslation('in_progress')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>
            {getStatusTranslation('completed')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'cannot_repaired' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('cannot_repaired')}
        >
          <Text style={[styles.filterText, filterStatus === 'cannot_repaired' && styles.filterTextActive]}>
            {getStatusTranslation('cannot_repaired')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'out' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('out')}
        >
          <Text style={[styles.filterText, filterStatus === 'out' && styles.filterTextActive]}>
            {getStatusTranslation('out')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'delivered' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('delivered')}
        >
          <Text style={[styles.filterText, filterStatus === 'delivered' && styles.filterTextActive]}>
            {getStatusTranslation('delivered')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'cancelled' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('cancelled')}
        >
          <Text style={[styles.filterText, filterStatus === 'cancelled' && styles.filterTextActive]}>
            {getStatusTranslation('cancelled')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'not_ok' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('not_ok')}
        >
          <Text style={[styles.filterText, filterStatus === 'not_ok' && styles.filterTextActive]}>
            {getStatusTranslation('not_ok')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.ticketCard}>
            <TouchableOpacity
              style={styles.ticketContent}
              onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
            >
              <View style={styles.ticketHeader}>
                <View style={styles.ticketInfo}>
                  <Text style={styles.ticketNumber} numberOfLines={1} ellipsizeMode="tail">
                    {item.repairNumber || item.id}
                  </Text>
                  <Text style={styles.ticketCustomer} numberOfLines={1} ellipsizeMode="tail">
                    {item.customerName || 'N/A'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(item.status || 'pending') + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: getStatusColor(item.status || 'pending'),
                      },
                    ]}
                  >
                    {getStatusTranslation(item.status || 'pending')}
                  </Text>
                </View>
              </View>
            <Text style={styles.ticketDevice} numberOfLines={1} ellipsizeMode="tail">
              {item.brand} {item.model}
            </Text>
            {item.problem && (
              <View style={styles.ticketField}>
                <Text style={styles.ticketFieldLabel}>Phone Issue:</Text>
                <Text style={styles.ticketFieldValue} numberOfLines={2} ellipsizeMode="tail">
                  {item.problem}
                </Text>
              </View>
            )}
            {(item.repairObs || item.serviceName || (Array.isArray(item.selectedServices) && item.selectedServices.length > 0)) && (
              <View style={styles.ticketField}>
                <Text style={styles.ticketFieldLabel}>Service Done:</Text>
                <Text style={styles.ticketFieldValue} numberOfLines={2} ellipsizeMode="tail">
                  {item.repairObs || item.serviceName || (Array.isArray(item.selectedServices) ? item.selectedServices.join(', ') : '')}
                </Text>
              </View>
            )}
              <View style={styles.ticketFooter}>
                <Text style={styles.ticketDate}>
                  {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                </Text>
                <Text style={styles.ticketPrice}>€{parseFloat(item.budget || item.price || 0).toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.printButton}
              onPress={(e) => {
                e.stopPropagation();
                handlePrint(item);
              }}
              disabled={printing === item.id}
            >
              {printing === item.id ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="print-outline" size={24} color={theme.colors.primary} style={{ fontWeight: 'bold' }} />
              )}
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>{t('tickets.noDevicesFound')}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]} // Extra padding for tab bar
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
      marginHorizontal: 20,
      marginVertical: theme.spacing.md,
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
      paddingHorizontal: 20,
      marginBottom: theme.spacing.sm,
      flexWrap: 'wrap',
      gap: 6,
      rowGap: 6,
    },
    filterButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 0,
      marginBottom: 0,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    filterTextActive: {
      color: '#ffffff',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingVertical: theme.spacing.md,
    },
    ticketCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      marginHorizontal: 0,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    ticketContent: {
      flex: 1,
      padding: theme.spacing.md,
    },
    printButton: {
      padding: theme.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minWidth: 50,
      minHeight: 50,
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
    ticketField: {
      marginBottom: theme.spacing.xs,
    },
    ticketFieldLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      marginBottom: 2,
    },
    ticketFieldValue: {
      fontSize: 12,
      color: theme.colors.text,
      lineHeight: 16,
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
      right: 20,
      bottom: 90,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#e78a53',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#e78a53',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      zIndex: 1000,
    },
  });
