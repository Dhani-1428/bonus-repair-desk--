import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { printTicket } from '../../services/printService';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function TicketDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { ticketId } = route.params as { ticketId: string };
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useLanguage();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

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

  useEffect(() => {
    loadTicket();
  }, [ticketId, user]);

  // Refresh when screen comes into focus to sync changes from web
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTicket();
    });
    return unsubscribe;
  }, [navigation, ticketId, user]);

  const loadTicket = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const response = await apiService.getTicket(ticketId, user.id);
      setTicket(response.ticket);
    } catch (error) {
      console.error('Error loading ticket:', error);
      Alert.alert(t('common.error'), t('error.loadDeviceFailed'));
    } finally {
      setLoading(false);
    }
  };


  const handlePrint = async () => {
    if (!ticket) return;

    try {
      setPrinting(true);
      await printTicket(ticket);
    } catch (error: any) {
      console.error('Error printing:', error);
      Alert.alert(t('common.error'), error.message || t('common.printFailed'));
    } finally {
      setPrinting(false);
    }
  };

  const handleDelete = () => {
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
              navigation.goBack();
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('common.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const handleChangeStatus = (newStatus: string) => {
    Alert.alert(
      t('ticket.changeStatus'),
      t('ticket.status.changeConfirmation')?.replace('{status}', t(`ticket.status.${newStatus}`) || newStatus) || `Change status to ${t(`ticket.status.${newStatus}`) || newStatus}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              console.log('[TicketDetailScreen] Updating status:', {
                ticketId,
                newStatus,
                userId: user?.id,
              });
              
              const result = await apiService.updateTicket(ticketId, {
                userId: user?.id,
                status: newStatus,
              });
              
              console.log('[TicketDetailScreen] Status update result:', result);
              
              await loadTicket();
              setShowStatusMenu(false);
              
              Alert.alert(
                t('common.success'),
                t('ticket.status.updatedSuccess') || 'Status updated successfully',
                [{ text: t('common.ok') }]
              );
            } catch (error: any) {
              console.error('[TicketDetailScreen] Status update error:', error);
              Alert.alert(t('common.error'), error.message || t('ticket.status.updateFailed') || 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const showActionMenu = () => {
    // All available statuses matching web admin panel
    const statusOptions = ['pending', 'in_progress', 'completed', 'delivered', 'cancelled', 'cannot_repaired', 'out', 'not_ok'];
    
    Alert.alert(
      t('common.status'),
      t('ticket.selectAction') || 'Select an action',
      [
        {
          text: t('ticket.edit'),
          onPress: () => navigation.navigate('EditTicket', { ticketId }),
        },
        {
          text: t('ticket.changeStatus'),
          onPress: () => {
            Alert.alert(
              t('ticket.changeStatus'),
              t('ticket.selectStatus') || 'Select new status',
              [
                ...statusOptions.map((status) => ({
                  text: t(`ticket.status.${status}`) || status,
                  onPress: () => handleChangeStatus(status),
                })),
                { text: t('common.cancel'), style: 'cancel' },
              ]
            );
          },
        },
        {
          text: t('ticket.printReceipt'),
          onPress: handlePrint,
        },
        {
          text: t('ticket.delete'),
          style: 'destructive',
          onPress: handleDelete,
        },
        { text: t('common.cancel'), style: 'cancel' },
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

  if (!ticket) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{t('error.deviceNotFound') || 'Device not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.ticketNumber}>{ticket.repairNumber || ticket.id}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusColor(ticket.status || 'pending') + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: getStatusColor(ticket.status || 'pending'),
                },
              ]}
            >
              {getStatusTranslation(ticket.status || 'pending')}
            </Text>
          </View>
        </View>
        <Text style={styles.date}>
          {t('ticket.created') || 'Created'}: {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ticket.customerInfo') || 'Customer Information'}</Text>
        <InfoRow label={t('form.customerName')} value={ticket.customerName || 'N/A'} />
        <InfoRow label={t('form.contact')} value={ticket.contact || 'N/A'} />
        <InfoRow label={t('form.clientId')} value={ticket.clientId || 'N/A'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ticket.deviceInfo') || 'Device Information'}</Text>
        <InfoRow label={t('form.brand')} value={ticket.brand || 'N/A'} />
        <InfoRow label={t('form.model')} value={ticket.model || 'N/A'} />
        <InfoRow label={t('form.imeiNumber')} value={ticket.imeiNo || 'N/A'} />
        <InfoRow label={t('form.serialNumber')} value={ticket.serialNo || 'N/A'} />
        <InfoRow label={t('form.warranty')} value={ticket.warranty || t('form.withoutWarranty')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ticket.repairDetails') || 'Repair Details'}</Text>
        <InfoRow label={t('form.problemDescription')} value={ticket.problem || 'N/A'} />
        <InfoRow label={t('form.condition')} value={ticket.condition || 'N/A'} />
        {ticket.equipmentObs && (
          <View style={styles.observationContainer}>
            <Text style={styles.observationLabel}>{t('form.equipmentObs')}:</Text>
            <Text style={styles.observationText}>{ticket.equipmentObs}</Text>
          </View>
        )}
        {ticket.repairObs && (
          <View style={styles.observationContainer}>
            <Text style={styles.observationLabel}>{t('form.repairObs')}:</Text>
            <Text style={styles.observationText}>{ticket.repairObs}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('form.accessories')}</Text>
        <View style={styles.accessoriesContainer}>
          <AccessoryItem label={t('form.battery')} checked={ticket.battery} />
          <AccessoryItem label={t('form.charger')} checked={ticket.charger} />
          <AccessoryItem label={t('form.simCard')} checked={ticket.simCard} />
          <AccessoryItem label={t('form.memoryCard')} checked={ticket.memoryCard} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ticket.servicesPricing') || 'Services & Pricing'}</Text>
        {ticket.selectedServices && ticket.selectedServices.length > 0 ? (
          ticket.selectedServices.map((service: string, index: number) => (
            <Text key={index} style={styles.serviceItem}>• {service}</Text>
          ))
        ) : (
          <Text style={styles.serviceItem}>• {ticket.serviceName || 'N/A'}</Text>
        )}
        {ticket.budget && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{t('form.budget')}:</Text>
            <Text style={styles.priceValue}>€{parseFloat(ticket.budget).toFixed(2)}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.menuButton]}
          onPress={showActionMenu}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>{t('common.status')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={{ marginBottom: theme.spacing.sm }}>
      <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 2 }}>
        {label}
      </Text>
      <Text 
        style={{ fontSize: 16, color: theme.colors.text, fontWeight: '500' }}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  );
}

function AccessoryItem({ label, checked }: { label: string; checked: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
      <Ionicons
        name={checked ? 'checkmark-circle' : 'close-circle'}
        size={20}
        color={checked ? theme.colors.success : theme.colors.textSecondary}
      />
      <Text style={{ marginLeft: theme.spacing.sm, color: theme.colors.text }}>
        {label}
      </Text>
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
    errorText: {
      color: theme.colors.error,
      fontSize: 16,
    },
    header: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    ticketNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    date: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    section: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 20,
      paddingVertical: theme.spacing.lg,
      marginTop: theme.spacing.md,
      marginHorizontal: 0,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    observationContainer: {
      marginTop: theme.spacing.sm,
      padding: theme.spacing.md,
      backgroundColor: '#2a2a2a',
      borderRadius: theme.borderRadius.md,
    },
    observationLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    observationText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    accessoriesContainer: {
      marginTop: theme.spacing.sm,
    },
    serviceItem: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    priceContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    priceLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    priceValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    actions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
    },
    menuButton: {
      backgroundColor: theme.colors.primary,
    },
    actionButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
