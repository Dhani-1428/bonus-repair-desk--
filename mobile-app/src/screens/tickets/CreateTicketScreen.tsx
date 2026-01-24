import React, { useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function CreateTicketScreen({ navigation }: any) {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
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
  });

  const handleSubmit = async () => {
    if (!formData.customerName || !formData.contact || !formData.brand || !formData.model) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiService.createTicket({
        ...formData,
        userId: user?.id,
        price: parseFloat(formData.price) || 0,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      });
      Alert.alert('Success', 'Ticket created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <FormInput
          label="Customer Name *"
          value={formData.customerName}
          onChangeText={(text) => setFormData({ ...formData, customerName: text })}
          placeholder="Enter customer name"
        />
        <FormInput
          label="Contact *"
          value={formData.contact}
          onChangeText={(text) => setFormData({ ...formData, contact: text })}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
        <FormInput
          label="Client ID"
          value={formData.clientId}
          onChangeText={(text) => setFormData({ ...formData, clientId: text }))}
          placeholder="CLI-0001"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <FormInput
          label="Brand *"
          value={formData.brand}
          onChangeText={(text) => setFormData({ ...formData, brand: text })}
          placeholder="e.g., Apple, Samsung"
        />
        <FormInput
          label="Model *"
          value={formData.model}
          onChangeText={(text) => setFormData({ ...formData, model: text })}
          placeholder="Device model"
        />
        <FormInput
          label="IMEI Number"
          value={formData.imeiNo}
          onChangeText={(text) => setFormData({ ...formData, imeiNo: text })}
          placeholder="15-digit IMEI"
        />
        <FormInput
          label="Serial Number"
          value={formData.serialNo}
          onChangeText={(text) => setFormData({ ...formData, serialNo: text }))}
          placeholder="Serial number"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repair Details</Text>
        <FormInput
          label="Problem Description *"
          value={formData.problem}
          onChangeText={(text) => setFormData({ ...formData, problem: text })}
          placeholder="Describe the problem"
          multiline
          numberOfLines={3}
        />
        <FormInput
          label="Condition"
          value={formData.condition}
          onChangeText={(text) => setFormData({ ...formData, condition: text })}
          placeholder="Device condition"
        />
        <FormInput
          label="Service Name"
          value={formData.serviceName}
          onChangeText={(text) => setFormData({ ...formData, serviceName: text }))}
          placeholder="Service required"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <FormInput
          label="Price"
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        <FormInput
          label="Budget"
          value={formData.budget}
          onChangeText={(text) => setFormData({ ...formData, budget: text }))}
          placeholder="0.00"
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Observations</Text>
        <FormInput
          label="Equipment Observations"
          value={formData.equipmentObs}
          onChangeText={(text) => setFormData({ ...formData, equipmentObs: text }))}
          placeholder="Equipment observations"
          multiline
          numberOfLines={3}
        />
        <FormInput
          label="Repair Observations"
          value={formData.repairObs}
          onChangeText={(text) => setFormData({ ...formData, repairObs: text }))}
          placeholder="Repair observations"
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>Create Ticket</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
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
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
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
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
      }}
    >
      <Text style={{ fontSize: 16, color: theme.colors.text }}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#767577', true: theme.colors.primary }} />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    submitButton: {
      backgroundColor: theme.colors.primary,
      margin: theme.spacing.lg,
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
