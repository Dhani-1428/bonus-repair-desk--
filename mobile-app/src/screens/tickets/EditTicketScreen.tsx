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
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await apiService.getTicket(ticketId, user.id);
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
      Alert.alert(t('common.error'), t('error.loadDeviceFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.customerName || !formData.contact || !formData.brand || !formData.model) {
      Alert.alert(t('common.error'), t('common.fillRequiredFields'));
      return;
    }

    if (formData.imeiNo && formData.imeiNo.length !== 15) {
      Alert.alert(t('common.error'), t('error.imei.exact'));
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
        price: null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        warranty: formData.warranty,
        battery: formData.battery,
        charger: formData.charger,
        simCard: formData.simCard,
        memoryCard: formData.memoryCard,
        equipmentObs: formData.equipmentObs || null,
        repairObs: formData.serviceName || null,
        serviceName: formData.serviceName,
      };

      await apiService.updateTicket(ticketId, updateData);
      Alert.alert(t('common.success'), t('message.deviceUpdatedSuccess'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('error.updateDeviceFailed'));
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
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('form.customerInformation')}</Text>
        <FormInput
          label={t('form.customerName') + ' *'}
          value={formData.customerName}
          onChangeText={(text) => setFormData({ ...formData, customerName: text })}
        />
        <FormInput
          label={t('form.contact') + ' *'}
          value={formData.contact}
          onChangeText={(text) => setFormData({ ...formData, contact: text })}
          keyboardType="phone-pad"
        />
        <FormInput
          label={t('form.clientId')}
          value={formData.clientId}
          onChangeText={(text) => setFormData({ ...formData, clientId: text })}
        />
        <FormInput
          label={t('form.receivedBy')}
          value={formData.receivedBy}
          onChangeText={(text) => setFormData({ ...formData, receivedBy: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('form.deviceInformation')}</Text>
        <FormInput
          label={t('form.brand') + ' *'}
          value={formData.brand}
          onChangeText={(text) => setFormData({ ...formData, brand: text })}
        />
        <FormInput
          label={t('form.model') + ' *'}
          value={formData.model}
          onChangeText={(text) => setFormData({ ...formData, model: text })}
        />
        <FormInput
          label={t('form.imeiNumber')}
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
          label={t('form.serialNumber')}
          value={formData.serialNo}
          onChangeText={(text) => setFormData({ ...formData, serialNo: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('form.repairDetails')}</Text>
        <FormInput
          label="On Arrival"
          value={formData.equipmentObs}
          onChangeText={(text) => setFormData({ ...formData, equipmentObs: text })}
          multiline
          numberOfLines={3}
        />
        <FormInput
          label="Phone Issue"
          value={formData.problem}
          onChangeText={(text) => setFormData({ ...formData, problem: text })}
          multiline
          numberOfLines={3}
        />
        <FormInput
          label="Service Done"
          value={formData.serviceName}
          onChangeText={(text) => setFormData({ ...formData, serviceName: text })}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('form.pricing')}</Text>
        <FormInput
          label={t('form.budget')}
          value={formData.budget}
          onChangeText={(text) => setFormData({ ...formData, budget: text })}
          keyboardType="decimal-pad"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('form.warranty')}</Text>
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
                {t('form.withoutWarranty')}
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
                {t('form.warranty30Days')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('form.accessories')}</Text>
        <SwitchRow
          label={t('form.battery')}
          value={formData.battery}
          onValueChange={(value) => setFormData({ ...formData, battery: value })}
        />
        <SwitchRow
          label={t('form.charger')}
          value={formData.charger}
          onValueChange={(value) => setFormData({ ...formData, charger: value })}
        />
        <SwitchRow
          label={t('form.simCard')}
          value={formData.simCard}
          onValueChange={(value) => setFormData({ ...formData, simCard: value })}
        />
        <SwitchRow
          label={t('form.memoryCard')}
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
