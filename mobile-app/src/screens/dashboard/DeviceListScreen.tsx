import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { BlurView } from 'expo-blur';

export default function DeviceListScreen({ route, navigation }: any) {
  const { filterType, filterValue, title } = route.params || {};
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useLanguage();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: title || t('dashboard.totalDevices'),
    });
  }, [title, navigation, t]);

  // Refresh when screen comes into focus (e.g., after status change)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadDevices();
      }
    }, [user?.id, filterType, filterValue])
  );

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

  const loadDevices = async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getTickets(user.id);
      let tickets = response.tickets || [];

      // Filter based on filterType (case-insensitive comparison)
      if (filterType === 'status') {
        if (filterValue === 'pending') {
          tickets = tickets.filter((t: any) => {
            const status = (t.status || '').toLowerCase();
            return status === 'pending' || status === 'in_progress';
          });
        } else if (filterValue === 'not_ok') {
          tickets = tickets.filter((t: any) => {
            const status = (t.status || '').toLowerCase();
            return status === 'not_ok' || status === 'cannot_repaired';
          });
        } else {
          tickets = tickets.filter((t: any) => {
            const status = (t.status || '').toLowerCase();
            return status === filterValue?.toLowerCase();
          });
        }
      } else if (filterType === 'all') {
        // Show all devices
        tickets = tickets;
      }

      // Sort by creation date (newest first)
      tickets = tickets.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setDevices(tickets);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderDevice = ({ item }: { item: any }) => (
    <BlurView key={item.id} intensity={60} tint="dark" style={styles.deviceCardWrapper}>
      <TouchableOpacity
        style={styles.deviceCard}
        onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
      >
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceNumber}>{item.repairNumber || item.id}</Text>
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
        <Text style={styles.deviceCustomer}>{item.customerName || 'N/A'}</Text>
        <Text style={styles.deviceInfo}>
          {item.brand} {item.model}
        </Text>
        {item.price && (
          <Text style={styles.devicePrice}>€{parseFloat(item.price).toFixed(2)}</Text>
        )}
        <Text style={styles.deviceDate}>
          {format(new Date(item.createdAt), 'MMM dd, yyyy')}
        </Text>
      </TouchableOpacity>
    </BlurView>
  );

  return (
    <View style={styles.container}>
      {devices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>{t('tickets.noDevicesFound')}</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
        />
      )}
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
    listContent: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: 120,
    },
    deviceCardWrapper: {
      marginBottom: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      overflow: 'hidden',
    },
    deviceCard: {
      padding: 20,
    },
    deviceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    deviceNumber: {
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
    deviceCustomer: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    deviceInfo: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    devicePrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    deviceDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
  });
