import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { BlurView } from 'expo-blur';

export default function TrashScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [deletedTickets, setDeletedTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeletedTickets();
  }, [user]);

  const loadDeletedTickets = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const tickets = await apiService.getTickets(user.id, true); // true = deleted tickets
      setDeletedTickets(tickets.tickets || tickets || []);
    } catch (error: any) {
      console.error('Error loading deleted tickets:', error);
      Alert.alert('Error', 'Failed to load deleted tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDeletedTickets();
  };

  const handleRestore = async (ticketId: string) => {
    Alert.alert(
      'Restore Ticket',
      'Are you sure you want to restore this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              // Note: You may need to add a restore endpoint to your API
              await loadDeletedTickets();
              Alert.alert('Success', 'Ticket restored successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to restore ticket');
            }
          },
        },
      ]
    );
  };

  const handlePermanentDelete = async (ticketId: string) => {
    Alert.alert(
      'Permanently Delete',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTicket(ticketId);
              await loadDeletedTickets();
              Alert.alert('Success', 'Ticket permanently deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ticket');
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
      <BlurView intensity={80} tint="dark" style={styles.blurHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Trash</Text>
            <Text style={styles.subtitle}>Deleted tickets and products</Text>
          </View>
          <Ionicons name="trash-outline" size={32} color={theme.colors.primary} />
        </View>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {deletedTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <BlurView intensity={60} tint="dark" style={styles.emptyCard}>
              <Ionicons name="trash-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>Trash is empty</Text>
              <Text style={styles.emptySubtext}>
                Deleted tickets will appear here
              </Text>
            </BlurView>
          </View>
        ) : (
          deletedTickets.map((ticket) => (
            <BlurView key={ticket.id} intensity={60} tint="dark" style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={styles.ticketInfo}>
                  <Text style={styles.customerName}>{ticket.customerName || 'Unknown'}</Text>
                  <Text style={styles.ticketNumber}>
                    {ticket.repairNumber || ticket.id?.substring(0, 8)}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Ionicons name="trash" size={16} color={theme.colors.error} />
                  <Text style={styles.statusText}>Deleted</Text>
                </View>
              </View>

              <View style={styles.ticketDetails}>
                {ticket.model && (
                  <View style={styles.detailRow}>
                    <Ionicons name="phone-portrait-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.detailText}>{ticket.model}</Text>
                  </View>
                )}
                {ticket.contact && (
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.detailText}>{ticket.contact}</Text>
                  </View>
                )}
                {ticket.deletedAt && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.detailText}>
                      Deleted: {format(new Date(ticket.deletedAt), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                )}
                {ticket.price && (
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.detailText}>€{parseFloat(ticket.price).toFixed(2)}</Text>
                  </View>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.restoreButton]}
                  onPress={() => handleRestore(ticket.id)}
                >
                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Restore</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handlePermanentDelete(ticket.id)}
                >
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          ))
        )}
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
    blurHeader: {
      paddingTop: 60,
      paddingBottom: 20,
      paddingHorizontal: 20,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyCard: {
      padding: 40,
      borderRadius: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 20,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    ticketCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    ticketHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    ticketInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    ticketNumber: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.error + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.error,
    },
    ticketDetails: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    detailText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 6,
    },
    restoreButton: {
      backgroundColor: theme.colors.primary,
    },
    deleteButton: {
      backgroundColor: theme.colors.error,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });
