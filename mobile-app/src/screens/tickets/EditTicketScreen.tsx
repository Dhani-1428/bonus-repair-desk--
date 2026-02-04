import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function EditTicketScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { ticketId } = route.params as { ticketId: string };
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    contact: '',
    clientId: '',
    brand: '',
    model: '',
    imeiNo: '',
    serialNo: '',
    problem: '',
    condition: '',
    price: '',
    budget: '',
    warranty: 'Without Warranty',
    battery: false,
    charger: false,
    simCard: false,
    memoryCard: false,
    equipmentObs: '',
    repairObs: '',
    serviceName: '',
    receivedBy: '',
  });

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTicket(ticketId);
      const ticket = response.ticket;
      
      setFormData({
        customerName: ticket.customerName || '',
        contact: ticket.contact || '',
        clientId: ticket.clientId || '',
        brand: ticket.brand || '',
        model: ticket.model || '',
        imeiNo: ticket.imeiNo || '',
        serialNo: ticket.serialNo || '',
        problem: ticket.problem || '',
        condition: ticket.condition || '',
        price: ticket.price?.toString() || '',
        budget: ticket.budget?.toString() || '',
        warranty: ticket.warranty || 'Without Warranty',
        battery: ticket.battery ?? false,
        charger: ticket.charger ?? false,
        simCard: ticket.simCard ?? false,
        memoryCard: ticket.memoryCard ?? false,
        equipmentObs: ticket.equipmentObs || '',
        repairObs: ticket.repairObs || '',
        serviceName: Array.isArray(ticket.selectedServices) 
          ? ticket.selectedServices.join(', ') 
          : ticket.serviceName || '',
        receivedBy: ticket.receivedBy || '',
      });
    } catch (error) {
      console.error('Error loading ticket:', error);
      Alert.alert('Error', 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.customerName || !formData.contact || !formData.brand || !formData.model) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.imeiNo && formData.imeiNo.length !== 15) {
      Alert.alert('Error', 'IMEI Number must be exactly 15 digits');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        userId: user?.id,
        customerName: formData.customerName,
        contact: formData.contact,
        receivedBy: formData.receivedBy,
        brand: formData.brand,
        model: formData.model,
        imeiNo: formData.imeiNo || null,
        serialNo: formData.serialNo || null,
        problem: formData.problem,
        condition: formData.condition || null,
        price: formData.price ? parseFloat(formData.price) : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        warranty: formData.warranty,
        battery: formData.battery,
        charger: formData.charger,
        simCard: formData.simCard,
        memoryCard: formData.memoryCard,
        equipmentObs: formData.equipmentObs || null,
        repairObs: formData.repairObs || null,
        serviceName: formData.serviceName,
      };

      await apiService.updateTicket(ticketId, updateData);
      Alert.alert('Success', 'Device updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update device');
    } finally {
      setSaving(false);
    }
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
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <FormInput
          label="Customer Name *"
          value={formData.customerName}
          onChangeText={(text) => setFormData({ ...formData, customerName: text })}
        />
        <FormInput
          label="Contact *"
          value={formData.contact}
          onChangeText={(text) => setFormData({ ...formData, contact: text })}
          keyboardType="phone-pad"
        />
        <FormInput
          label="Client ID"
          value={formData.clientId}
          onChangeText={(text) => setFormData({ ...formData, clientId: text })}
        />
        <FormInput
          label="Received By"
          value={formData.receivedBy}
          onChangeText={(text) => setFormData({ ...formData, receivedBy: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <FormInput
          label="Brand *"
          value={formData.brand}
          onChangeText={(text) => setFormData({ ...formData, brand: text })}
        />
        <FormInput
          label="Model *"
          value={formData.model}
          onChangeText={(text) => setFormData({ ...formData, model: text })}
        />
        <FormInput
          label="IMEI Number"
          value={formData.imeiNo}
          onChangeText={(text) => {
            const digitsOnly = text.replace(/\D/g, '');
            if (digitsOnly.length <= 15) {
              setFormData({ ...formData, imeiNo: digitsOnly });
            }
          }}
          keyboardType="numeric"
          maxLength={15}
        />
        <FormInput
          label="Serial Number"
          value={formData.serialNo}
          onChangeText={(text) => setFormData({ ...formData, serialNo: text })}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Warranty</Text>
          <View style={styles.warrantyButtons}>
            <TouchableOpacity
              style={[
                styles.warrantyButton,
                formData.warranty === 'Without Warranty' && styles.warrantyButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, warranty: 'Without Warranty' })}
            >
              <Text
                style={[
                  styles.warrantyButtonText,
                  formData.warranty === 'Without Warranty' && styles.warrantyButtonTextActive,
                ]}
              >
                Without Warranty
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.warrantyButton,
                formData.warranty === 'Warranty Until 30 days' && styles.warrantyButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, warranty: 'Warranty Until 30 days' })}
            >
              <Text
                style={[
                  styles.warrantyButtonText,
                  formData.warranty === 'Warranty Until 30 days' && styles.warrantyButtonTextActive,
                ]}
              >
                30 Days
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repair Details</Text>
        <FormInput
          label="Problem"
          value={formData.problem}
          onChangeText={(text) => setFormData({ ...formData, problem: text })}
          multiline
          numberOfLines={3}
        />
        <FormInput
          label="Condition"
          value={formData.condition}
          onChangeText={(text) => setFormData({ ...formData, condition: text })}
          multiline
          numberOfLines={2}
        />
        <FormInput
          label="Service Name"
          value={formData.serviceName}
          onChangeText={(text) => setFormData({ ...formData, serviceName: text })}
        />
        <FormInput
          label="Equipment Observations"
          value={formData.equipmentObs}
          onChangeText={(text) => setFormData({ ...formData, equipmentObs: text })}
          multiline
          numberOfLines={3}
        />
        <FormInput
          label="Repair Observations"
          value={formData.repairObs}
          onChangeText={(text) => setFormData({ ...formData, repairObs: text })}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <FormInput
          label="Price"
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          keyboardType="decimal-pad"
        />
        <FormInput
          label="Budget"
          value={formData.budget}
          onChangeText={(text) => setFormData({ ...formData, budget: text })}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessories</Text>
        <SwitchRow
          label="Battery"
          value={formData.battery}
          onValueChange={(value) => setFormData({ ...formData, battery: value })}
        />
        <SwitchRow
          label="Charger"
          value={formData.charger}
          onValueChange={(value) => setFormData({ ...formData, charger: value })}
        />
        <SwitchRow
          label="SIM Card"
          value={formData.simCard}
          onValueChange={(value) => setFormData({ ...formData, simCard: value })}
        />
        <SwitchRow
          label="Memory Card"
          value={formData.memoryCard}
          onValueChange={(value) => setFormData({ ...formData, memoryCard: value })}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>{t('common.save')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
  numberOfLines,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
}) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: '#2a2a2a',
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          color: theme.colors.text,
          fontSize: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          minHeight: multiline ? 80 : 44,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
      />
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
      <Text style={{ fontSize: 16, color: theme.colors.text }}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#767577', true: theme.colors.primary }} thumbColor={value ? '#fff' : '#f4f3f4'} />
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
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    switchRow: {
      marginBottom: theme.spacing.md,
    },
    switchLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    warrantyButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    warrantyButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
    },
    warrantyButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    warrantyButtonText: {
      color: theme.colors.text,
      fontSize: 14,
    },
    warrantyButtonTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      marginHorizontal: 20,
      marginVertical: theme.spacing.lg,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
