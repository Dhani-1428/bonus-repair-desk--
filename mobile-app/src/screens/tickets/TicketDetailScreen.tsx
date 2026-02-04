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
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    loadTicket();
    loadCompanyInfo();
  }, [ticketId, user]);

  const loadTicket = async () => {
    try {
      const response = await apiService.getTicket(ticketId);
      setTicket(response.ticket);
    } catch (error) {
      console.error('Error loading ticket:', error);
      Alert.alert('Error', 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyInfo = async () => {
    if (!user?.id) return;
    try {
      const response = await apiService.getUser(user.id);
      if (response.user) {
        setCompanyInfo({
          shopName: response.user.shopName || response.user.name,
          address: response.user.address,
          companyEmail: response.user.companyEmail,
          website: response.user.website,
          contactNumber: response.user.contactNumber,
        });
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const handlePrint = async () => {
    if (!ticket) return;

    try {
      setPrinting(true);
      await printTicket(ticket, companyInfo);
    } catch (error: any) {
      console.error('Error printing:', error);
      Alert.alert('Print Error', error.message || 'Failed to print receipt');
    } finally {
      setPrinting(false);
    }
  };

  const handleDelete = () => {
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
              navigation.goBack();
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

  if (!ticket) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Ticket not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
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
        <Text style={styles.date}>
          Created: {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <InfoRow label="Name" value={ticket.customerName || 'N/A'} />
        <InfoRow label="Contact" value={ticket.contact || 'N/A'} />
        <InfoRow label="Client ID" value={ticket.clientId || 'N/A'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <InfoRow label="Brand" value={ticket.brand || 'N/A'} />
        <InfoRow label="Model" value={ticket.model || 'N/A'} />
        <InfoRow label="IMEI" value={ticket.imeiNo || 'N/A'} />
        <InfoRow label="Serial No" value={ticket.serialNo || 'N/A'} />
        <InfoRow label="Warranty" value={ticket.warranty || 'Without Warranty'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repair Details</Text>
        <InfoRow label="Problem" value={ticket.problem || 'N/A'} />
        <InfoRow label="Condition" value={ticket.condition || 'N/A'} />
        {ticket.equipmentObs && (
          <View style={styles.observationContainer}>
            <Text style={styles.observationLabel}>Equipment Observations:</Text>
            <Text style={styles.observationText}>{ticket.equipmentObs}</Text>
          </View>
        )}
        {ticket.repairObs && (
          <View style={styles.observationContainer}>
            <Text style={styles.observationLabel}>Repair Observations:</Text>
            <Text style={styles.observationText}>{ticket.repairObs}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessories</Text>
        <View style={styles.accessoriesContainer}>
          <AccessoryItem label="Battery" checked={ticket.battery} />
          <AccessoryItem label="Charger" checked={ticket.charger} />
          <AccessoryItem label="SIM Card" checked={ticket.simCard} />
          <AccessoryItem label="Memory Card" checked={ticket.memoryCard} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services & Pricing</Text>
        {ticket.selectedServices && ticket.selectedServices.length > 0 ? (
          ticket.selectedServices.map((service: string, index: number) => (
            <Text key={index} style={styles.serviceItem}>• {service}</Text>
          ))
        ) : (
          <Text style={styles.serviceItem}>• {ticket.serviceName || 'N/A'}</Text>
        )}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price:</Text>
          <Text style={styles.priceValue}>${parseFloat(ticket.price || 0).toFixed(2)}</Text>
        </View>
        {ticket.budget && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Budget:</Text>
            <Text style={styles.priceValue}>${parseFloat(ticket.budget).toFixed(2)}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.printButton]}
          onPress={handlePrint}
          disabled={printing}
        >
          {printing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="print-outline" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Print</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            // Navigate to edit screen (you can implement this)
            Alert.alert('Info', 'Edit functionality coming soon');
          }}
        >
          <Ionicons name="create-outline" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Delete</Text>
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
      <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '500' }}>
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
      padding: theme.spacing.lg,
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
      padding: theme.spacing.lg,
      marginTop: theme.spacing.md,
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
      padding: theme.spacing.lg,
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
    printButton: {
      backgroundColor: theme.colors.primary,
    },
    editButton: {
      backgroundColor: theme.colors.secondary,
    },
    deleteButton: {
      backgroundColor: theme.colors.error,
    },
    actionButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
