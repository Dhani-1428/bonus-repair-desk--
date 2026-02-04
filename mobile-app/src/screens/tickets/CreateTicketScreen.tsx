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
  Modal,
  FlatList,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

// Brand and Model data (same as website)
const BRANDS_AND_MODELS: Record<string, string[]> = {
  "Apple": ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15", "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14", "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini", "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini", "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11", "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X", "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7", "iPhone SE (2022)", "iPhone SE (2020)"],
  "Samsung": ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22", "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21", "Galaxy Note 20 Ultra", "Galaxy Note 20", "Galaxy A54", "Galaxy A34", "Galaxy A24", "Galaxy A14", "Galaxy A04", "Galaxy Z Fold 5", "Galaxy Z Flip 5", "Galaxy Z Fold 4", "Galaxy Z Flip 4"],
  "Xiaomi": ["Mi 13 Pro", "Mi 13", "Mi 12 Pro", "Mi 12", "Redmi Note 13 Pro", "Redmi Note 13", "Redmi Note 12 Pro", "Redmi Note 12", "Redmi Note 11", "Redmi 13C", "Redmi 12C", "POCO X6 Pro", "POCO X5 Pro", "POCO F5", "POCO M5"],
  "Huawei": ["P60 Pro", "P60", "P50 Pro", "P50", "Mate 60 Pro", "Mate 60", "Mate 50 Pro", "Mate 50", "Nova 12", "Nova 11", "Nova 10"],
  "Oppo": ["Find X6 Pro", "Find X5 Pro", "Find X5", "Reno 11 Pro", "Reno 11", "Reno 10 Pro", "Reno 10", "A98", "A78", "A58"],
  "Vivo": ["X100 Pro", "X90 Pro", "X90", "V30 Pro", "V30", "V29", "Y36", "Y27", "Y17"],
  "OnePlus": ["12", "11", "10 Pro", "10T", "Nord 3", "Nord 2T", "Nord CE 3"],
  "Realme": ["GT 5 Pro", "GT 5", "GT 3", "11 Pro+", "11 Pro", "11", "10 Pro+", "10 Pro"],
  "Motorola": ["Edge 40 Pro", "Edge 40", "Edge 30 Pro", "Moto G84", "Moto G73", "Moto G54"],
  "Nokia": ["G60 5G", "G42 5G", "G22", "X30 5G", "X20"],
  "Sony": ["Xperia 1 V", "Xperia 5 V", "Xperia 10 V", "Xperia Pro-I"],
  "Google": ["Pixel 8 Pro", "Pixel 8", "Pixel 7 Pro", "Pixel 7", "Pixel 6a", "Pixel 6"],
  "Honor": ["Magic 6 Pro", "Magic 5 Pro", "90 Pro", "90", "70"],
  "Nothing": ["Phone (2)", "Phone (1)"],
  "Other": []
};

const ALL_BRANDS = Object.keys(BRANDS_AND_MODELS);

// Generate Client ID - starts from 0001
const generateClientId = async (userId: string): Promise<string> => {
  try {
    const response = await apiService.getTickets(userId);
    const tickets = response.tickets || [];
    
    // Extract numeric part from existing client IDs (format: CLI-0001, CLI-0002, etc.)
    let maxNumber = 0;
    tickets.forEach((ticket: any) => {
      if (ticket.clientId && typeof ticket.clientId === 'string') {
        // Match CLI- followed by 1-4 digits only
        const match = ticket.clientId.match(/^CLI-(\d{1,4})$/);
        if (match) {
          const num = parseInt(match[1], 10);
          // Only consider reasonable numbers (1 to 9999)
          if (!isNaN(num) && num >= 1 && num <= 9999 && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });
    
    // If no valid client IDs found, start from 1
    const nextNumber = maxNumber === 0 ? 1 : maxNumber + 1;
    return `CLI-${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('[generateClientId] Error fetching tickets:', error);
    return 'CLI-0001';
  }
};

// Generate preview Repair Number
const getRepairNumberPreview = (): string => {
  const year = new Date().getFullYear();
  return `REP-${year}-XXXX`; // XXXX will be replaced with actual sequence on server
};

export default function CreateTicketScreen({ navigation }: any) {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [generatingClientId, setGeneratingClientId] = useState(true);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    contact: '',
    clientId: '',
    receivedBy: '',
    brand: '',
    model: '',
    imeiNo: '',
    serialNo: '',
    softwareVersion: '',
    problem: '',
    condition: '',
    price: '',
    budget: '',
    warranty: 'Without Warranty',
    battery: false,
    charger: false,
    simCard: false,
    simTray: false,
    memoryCard: false,
    waterDamaged: false,
    loanEquipment: false,
    equipmentObs: '',
    repairObs: '',
    serviceName: '',
  });

  useEffect(() => {
    // Auto-generate Client ID on mount
    if (user?.id) {
      setGeneratingClientId(true);
      generateClientId(user.id)
        .then((clientId) => {
          setFormData((prev) => ({ ...prev, clientId }));
        })
        .catch(() => {
          setFormData((prev) => ({ ...prev, clientId: 'CLI-0001' }));
        })
        .finally(() => {
          setGeneratingClientId(false);
        });
    }
  }, [user?.id]);

  const handleSubmit = async () => {
    // Validate required fields (matching website requirements)
    if (!formData.customerName || !formData.receivedBy) {
      Alert.alert('Error', 'Customer Name and Received By are required fields');
      return;
    }

    // Validate IMEI if provided (must be exactly 15 digits)
    if (formData.imeiNo && formData.imeiNo.trim() !== '' && !/^\d{15}$/.test(formData.imeiNo)) {
      Alert.alert('Error', 'IMEI must be exactly 15 digits (if provided)');
      return;
    }

    setLoading(true);
    try {
      await apiService.createTicket({
        userId: user?.id,
        clientId: formData.clientId || null, // Will be auto-generated on server if null
        customerName: formData.customerName,
        contact: formData.contact || null,
        receivedBy: formData.receivedBy,
        imeiNo: formData.imeiNo && formData.imeiNo.trim() !== '' ? formData.imeiNo.trim() : null,
        brand: formData.brand || null,
        model: formData.model || null,
        serialNo: formData.serialNo || null,
        softwareVersion: formData.softwareVersion || null,
        warranty: formData.warranty,
        simCard: formData.simCard,
        simTray: formData.simTray,
        memoryCard: formData.memoryCard,
        charger: formData.charger,
        battery: formData.battery,
        waterDamaged: formData.waterDamaged,
        loanEquipment: formData.loanEquipment,
        equipmentObs: formData.equipmentObs || null,
        repairObs: formData.repairObs || null,
        selectedServices: formData.serviceName ? [formData.serviceName] : [],
        condition: formData.condition || null,
        problem: formData.problem || null,
        price: parseFloat(formData.price) || 0,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: 'PENDING',
      });
      Alert.alert('Success', 'Device created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create device');
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
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
            Client ID (Auto-generated)
          </Text>
          <View style={styles.autoGeneratedField}>
            {generatingClientId ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={styles.autoGeneratedText}>{formData.clientId || 'CLI-0001'}</Text>
            )}
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} style={{ marginLeft: 8 }} />
          </View>
        </View>
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
            Repair Number (Auto-generated)
          </Text>
          <View style={styles.autoGeneratedField}>
            <Text style={styles.autoGeneratedText}>{getRepairNumberPreview()}</Text>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} style={{ marginLeft: 8 }} />
          </View>
        </View>
        <FormInput
          label="Received By *"
          value={formData.receivedBy}
          onChangeText={(text) => setFormData({ ...formData, receivedBy: text })}
          placeholder="Enter your name"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
            Brand *
          </Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowBrandModal(true)}
          >
            <Text style={[styles.dropdownText, !formData.brand && styles.dropdownPlaceholder]}>
              {formData.brand || 'Select Brand'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
            Model *
          </Text>
          <TouchableOpacity
            style={[styles.dropdownButton, !formData.brand && styles.dropdownButtonDisabled]}
            onPress={() => formData.brand && setShowModelModal(true)}
            disabled={!formData.brand}
          >
            <Text style={[styles.dropdownText, !formData.model && styles.dropdownPlaceholder]}>
              {formData.model || (formData.brand ? 'Select Model' : 'Select Brand First')}
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={formData.brand ? theme.colors.textSecondary : theme.colors.textSecondary + '60'} 
            />
          </TouchableOpacity>
        </View>
        <FormInput
          label="IMEI Number"
          value={formData.imeiNo}
          onChangeText={(text) => {
            const digitsOnly = text.replace(/\D/g, '');
            if (digitsOnly.length <= 15) {
              setFormData({ ...formData, imeiNo: digitsOnly });
            }
          }}
          placeholder="15-digit IMEI (optional)"
          keyboardType="numeric"
          maxLength={15}
        />
        <FormInput
          label="Serial Number"
          value={formData.serialNo}
          onChangeText={(text) => setFormData({ ...formData, serialNo: text })}
          placeholder="Serial number"
        />
        <FormInput
          label="Software Version"
          value={formData.softwareVersion}
          onChangeText={(text) => setFormData({ ...formData, softwareVersion: text })}
          placeholder="e.g., iOS 17.0, Android 14"
        />
        <View style={styles.warrantyContainer}>
          <Text style={styles.warrantyLabel}>Warranty</Text>
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
          label="Problem Description"
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
          onChangeText={(text) => setFormData({ ...formData, serviceName: text })}
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
          onChangeText={(text) => setFormData({ ...formData, budget: text })}
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
          label="SIM Tray"
          value={formData.simTray}
          onValueChange={(value) => setFormData({ ...formData, simTray: value })}
        />
        <SwitchRow
          label="Memory Card"
          value={formData.memoryCard}
          onValueChange={(value) => setFormData({ ...formData, memoryCard: value })}
        />
        <SwitchRow
          label="Water Damaged"
          value={formData.waterDamaged}
          onValueChange={(value) => setFormData({ ...formData, waterDamaged: value })}
        />
        <SwitchRow
          label="Loan Equipment"
          value={formData.loanEquipment}
          onValueChange={(value) => setFormData({ ...formData, loanEquipment: value })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Observations</Text>
        <FormInput
          label="Equipment Observations"
          value={formData.equipmentObs}
          onChangeText={(text) => setFormData({ ...formData, equipmentObs: text })}
          placeholder="Equipment observations"
          multiline
          numberOfLines={3}
        />
        <FormInput
          label="Repair Observations"
          value={formData.repairObs}
          onChangeText={(text) => setFormData({ ...formData, repairObs: text })}
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
          <Text style={styles.submitButtonText}>Create Device</Text>
        )}
      </TouchableOpacity>

      {/* Brand Selection Modal */}
      <Modal
        visible={showBrandModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBrandModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Brand</Text>
              <TouchableOpacity onPress={() => setShowBrandModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ALL_BRANDS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formData.brand === item && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, brand: item, model: '' }); // Clear model when brand changes
                    setShowBrandModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      formData.brand === item && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {formData.brand === item && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Model Selection Modal */}
      <Modal
        visible={showModelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Model</Text>
              <TouchableOpacity onPress={() => setShowModelModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {formData.brand && formData.brand !== 'Other' && BRANDS_AND_MODELS[formData.brand] ? (
              <FlatList
                data={BRANDS_AND_MODELS[formData.brand]}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      formData.model === item && styles.modalItemSelected,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, model: item });
                      setShowModelModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        formData.model === item && styles.modalItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {formData.model === item && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>
                  {formData.brand === 'Other' 
                    ? 'Please enter model manually' 
                    : 'No models available for this brand'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    warrantyContainer: {
      marginBottom: theme.spacing.md,
    },
    warrantyLabel: {
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
    autoGeneratedField: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2a2a2a',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
      borderStyle: 'dashed',
    },
    autoGeneratedText: {
      flex: 1,
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'monospace',
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#2a2a2a',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 44,
    },
    dropdownButtonDisabled: {
      opacity: 0.5,
    },
    dropdownText: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 16,
    },
    dropdownPlaceholder: {
      color: theme.colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    modalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '20',
    },
    modalItemSelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    modalItemText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    modalItemTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    modalEmpty: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    modalEmptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
