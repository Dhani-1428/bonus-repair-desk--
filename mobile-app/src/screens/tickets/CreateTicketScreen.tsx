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
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Storage keys for custom brands and models
const CUSTOM_BRANDS_KEY = '@custom_brands';
const CUSTOM_MODELS_KEY = '@custom_models';

// Load custom brands and models from storage
const loadCustomData = async (): Promise<{ customBrands: string[], customModels: Record<string, string[]> }> => {
  try {
    const [customBrandsJson, customModelsJson] = await Promise.all([
      AsyncStorage.getItem(CUSTOM_BRANDS_KEY),
      AsyncStorage.getItem(CUSTOM_MODELS_KEY),
    ]);
    const customBrands = customBrandsJson ? JSON.parse(customBrandsJson) : [];
    const customModels = customModelsJson ? JSON.parse(customModelsJson) : {};
    return { customBrands, customModels };
  } catch (error) {
    console.error('Error loading custom data:', error);
    return { customBrands: [], customModels: {} };
  }
};

// Save custom brands and models to storage
const saveCustomData = async (customBrands: string[], customModels: Record<string, string[]>) => {
  try {
    await Promise.all([
      AsyncStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(customBrands)),
      AsyncStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(customModels)),
    ]);
  } catch (error) {
    console.error('Error saving custom data:', error);
  }
};

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
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [generatingClientId, setGeneratingClientId] = useState(true);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [customBrands, setCustomBrands] = useState<string[]>([]);
  const [customModels, setCustomModels] = useState<Record<string, string[]>>({});
  const [brandsAndModels, setBrandsAndModels] = useState<Record<string, string[]>>(BRANDS_AND_MODELS);
  const [formData, setFormData] = useState({
    customerName: '',
    contact: '',
    clientId: '',
    receivedBy: '',
    brand: '',
    model: '',
    imeiNo: '',
    serialNo: '',
    phoneIssue: '',
    price: '',
    budget: '',
    priceType: 'budget' as 'budget' | 'price',
    warrantyUntil30Days: false,
    battery: false,
    charger: false,
    simCard: false,
    simTray: false,
    memoryCard: false,
    waterDamaged: false,
    loanEquipment: false,
    equipmentObs: '',
  });

  useEffect(() => {
    // Load custom brands and models
    loadCustomData().then(({ customBrands, customModels }) => {
      setCustomBrands(customBrands);
      setCustomModels(customModels);
      
      // Merge custom data with default brands and models
      const merged = { ...BRANDS_AND_MODELS };
      customBrands.forEach(brand => {
        if (!merged[brand]) {
          merged[brand] = customModels[brand] || [];
        } else {
          // Merge custom models with existing models
          const existingModels = merged[brand] || [];
          const customBrandModels = customModels[brand] || [];
          merged[brand] = [...new Set([...existingModels, ...customBrandModels])];
        }
      });
      setBrandsAndModels(merged);
    });

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
      Alert.alert(t('common.error'), t('form.requiredFields'));
      return;
    }

    // Validate IMEI if provided (must be exactly 15 digits)
    if (formData.imeiNo && formData.imeiNo.trim() !== '' && !/^\d{15}$/.test(formData.imeiNo)) {
      Alert.alert(t('common.error'), t('form.imeiValidation'));
      return;
    }

    setLoading(true);
    try {
      console.log('[CreateTicket] Submitting device creation...', {
        userId: user?.id,
        customerName: formData.customerName,
        receivedBy: formData.receivedBy,
        brand: formData.brand,
        model: formData.model,
      });

      const translate = (key: string) => {
        try {
          return t(key);
        } catch (error) {
          const fallbacks: Record<string, string> = {
            "form.warrantyUntil30Days": "Warranty Until 30 Days",
            "form.withoutWarranty": "Without Warranty"
          };
          return fallbacks[key] || key;
        }
      };

      const ticketData = {
        userId: user?.id,
        clientId: formData.clientId || null, // Will be auto-generated on server if null
        customerName: formData.customerName,
        contact: formData.contact || null,
        receivedBy: formData.receivedBy,
        imeiNo: formData.imeiNo && formData.imeiNo.trim() !== '' ? formData.imeiNo.trim() : null,
        brand: formData.brand || null,
        model: formData.model || null,
        serialNo: formData.serialNo || null,
        warranty: formData.warrantyUntil30Days ? translate("form.warrantyUntil30Days") : translate("form.withoutWarranty"),
        simCard: formData.simCard,
        simTray: formData.simTray,
        memoryCard: formData.memoryCard,
        charger: formData.charger,
        battery: formData.battery,
        waterDamaged: formData.waterDamaged,
        loanEquipment: false,
        equipmentObs: formData.equipmentObs || null,
        phoneIssue: formData.phoneIssue || null,
        repairObs: null,
        selectedServices: [],
        condition: null,
        problem: null,
        price: parseFloat(formData.price) || 0,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        priceType: formData.priceType || "budget",
        status: 'PENDING',
      };

      console.log('[CreateTicket] Sending data to API...', ticketData);
      const result = await apiService.createTicket(ticketData);
      console.log('[CreateTicket] Device created successfully:', result);
      
      Alert.alert(t('common.success'), t('form.deviceCreated'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('[CreateTicket] Error creating device:', error);
      const errorMessage = error?.message || error?.toString() || t('form.createFailed');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

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
          placeholder={t('placeholder.customerName')}
        />
        <FormInput
          label={t('form.contact') + ' *'}
          value={formData.contact}
          onChangeText={(text) => setFormData({ ...formData, contact: text })}
          placeholder={t('placeholder.contactNumber')}
          keyboardType="phone-pad"
        />
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
            {t('form.clientIdAuto')}
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
            {t('form.repairNumberAuto')}
          </Text>
          <View style={styles.autoGeneratedField}>
            <Text style={styles.autoGeneratedText}>{getRepairNumberPreview()}</Text>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} style={{ marginLeft: 8 }} />
          </View>
        </View>
        <FormInput
          label={t('form.receivedBy') + ' *'}
          value={formData.receivedBy}
          onChangeText={(text) => setFormData({ ...formData, receivedBy: text })}
          placeholder={t('placeholder.receivedBy')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('form.deviceInformation')}</Text>
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
            {t('form.brand')} *
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={formData.brand}
              onChangeText={(text) => {
                setFormData({ ...formData, brand: text, model: '' });
                // Auto-add new brand if not exists
                if (text && !brandsAndModels[text] && !customBrands.includes(text)) {
                  const newCustomBrands = [...customBrands, text];
                  const newCustomModels = { ...customModels, [text]: [] };
                  setCustomBrands(newCustomBrands);
                  setCustomModels(newCustomModels);
                  setBrandsAndModels({ ...brandsAndModels, [text]: [] });
                  saveCustomData(newCustomBrands, newCustomModels);
                }
              }}
              placeholder={t('form.selectBrandOrType')}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TouchableOpacity
              style={styles.dropdownButtonSmall}
              onPress={() => setShowBrandModal(true)}
            >
              <Ionicons name="list" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
            {t('form.model')} *
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={formData.model}
              onChangeText={(text) => {
                setFormData({ ...formData, model: text });
                // Auto-add new model to current brand if not exists
                if (text && formData.brand) {
                  const brandModels = brandsAndModels[formData.brand] || [];
                  if (!brandModels.includes(text)) {
                    const updatedModels = [...brandModels, text];
                    const updatedBrandsAndModels = { ...brandsAndModels, [formData.brand]: updatedModels };
                    setBrandsAndModels(updatedBrandsAndModels);
                    
                    // Save to custom models
                    const newCustomModels = {
                      ...customModels,
                      [formData.brand]: [...(customModels[formData.brand] || []), text],
                    };
                    setCustomModels(newCustomModels);
                    saveCustomData(customBrands, newCustomModels);
                  }
                }
              }}
              placeholder={formData.brand ? t('form.selectModelOrType') : t('form.selectBrandFirst')}
              placeholderTextColor={theme.colors.textSecondary}
              editable={!!formData.brand}
            />
            <TouchableOpacity
              style={[styles.dropdownButtonSmall, !formData.brand && styles.dropdownButtonDisabled]}
              onPress={() => formData.brand && setShowModelModal(true)}
              disabled={!formData.brand}
            >
              <Ionicons 
                name="list" 
                size={20} 
                color={formData.brand ? theme.colors.primary : theme.colors.textSecondary + '60'} 
              />
            </TouchableOpacity>
          </View>
        </View>
        <FormInput
          label={t('form.imeiNumber')}
          value={formData.imeiNo}
          onChangeText={(text) => {
            const digitsOnly = text.replace(/\D/g, '');
            if (digitsOnly.length <= 15) {
              setFormData({ ...formData, imeiNo: digitsOnly });
            }
          }}
          placeholder={t('form.imeiPlaceholder')}
          keyboardType="numeric"
          maxLength={15}
        />
        <FormInput
          label={t('form.laptopSerialNumber') || 'Serial Number'}
          value={formData.serialNo}
          onChangeText={(text) => setFormData({ ...formData, serialNo: text })}
          placeholder={t('form.laptopSerialNumberPlaceholder') || 'Enter serial number'}
        />
        <FormInput
          label="Mobile Conditions (On Arrival)"
          value={formData.equipmentObs}
          onChangeText={(text) => setFormData({ ...formData, equipmentObs: text })}
          placeholder={t('placeholder.equipmentObservations') || 'Enter equipment observations'}
          multiline
          numberOfLines={3}
        />
        <FormInput
          label="Phone Issue"
          value={formData.phoneIssue}
          onChangeText={(text) => setFormData({ ...formData, phoneIssue: text })}
          placeholder="Enter phone issue"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('form.pricing') || 'Pricing'}</Text>
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
            {t('form.budget')} / {t('form.price')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              style={[
                styles.priceTypeButton,
                formData.priceType === 'budget' && styles.priceTypeButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, priceType: 'budget' })}
            >
              <Text
                style={[
                  styles.priceTypeButtonText,
                  formData.priceType === 'budget' && styles.priceTypeButtonTextActive,
                ]}
              >
                {t('form.budget')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.priceTypeButton,
                formData.priceType === 'price' && styles.priceTypeButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, priceType: 'price' })}
            >
              <Text
                style={[
                  styles.priceTypeButtonText,
                  formData.priceType === 'price' && styles.priceTypeButtonTextActive,
                ]}
              >
                {t('form.price')}
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, color: theme.colors.text, marginRight: 4 }}>€</Text>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={formData.priceType === 'price' ? formData.price : formData.budget}
                onChangeText={(text) => {
                  const value = text.replace(/[^0-9.]/g, '');
                  if (formData.priceType === 'price') {
                    setFormData({ ...formData, price: value });
                  } else {
                    setFormData({ ...formData, budget: value });
                  }
                }}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <Switch
            value={formData.warrantyUntil30Days}
            onValueChange={(value) => setFormData({ ...formData, warrantyUntil30Days: value })}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
          />
          <Text style={{ fontSize: 16, color: theme.colors.text, marginLeft: theme.spacing.sm }}>
            {t('form.warrantyUntil30Days')}
          </Text>
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
          label={t('form.simTray')}
          value={formData.simTray}
          onValueChange={(value) => setFormData({ ...formData, simTray: value })}
        />
        <SwitchRow
          label={t('form.memoryCard')}
          value={formData.memoryCard}
          onValueChange={(value) => setFormData({ ...formData, memoryCard: value })}
        />
        <SwitchRow
          label={t('form.waterDamaged')}
          value={formData.waterDamaged}
          onValueChange={(value) => setFormData({ ...formData, waterDamaged: value })}
        />
        <SwitchRow
          label={t('form.loanEquipment')}
          value={formData.loanEquipment}
          onValueChange={(value) => setFormData({ ...formData, loanEquipment: value })}
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
          <Text style={styles.submitButtonText}>{t('form.createDevice')}</Text>
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
              <Text style={styles.modalTitle}>{t('form.selectBrand')}</Text>
              <TouchableOpacity onPress={() => setShowBrandModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={Object.keys(brandsAndModels)}
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
              <Text style={styles.modalTitle}>{t('form.selectModel')}</Text>
              <TouchableOpacity onPress={() => setShowModelModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {formData.brand && brandsAndModels[formData.brand] && brandsAndModels[formData.brand].length > 0 ? (
              <FlatList
                data={brandsAndModels[formData.brand]}
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
                    ? t('form.enterModelManually') 
                    : t('form.noModelsAvailable')}
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
  maxLength,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
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
        maxLength={maxLength}
        editable={editable}
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
    textInput: {
      backgroundColor: '#2a2a2a',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 44,
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
    dropdownButtonSmall: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2a2a2a',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      width: 44,
      height: 44,
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
    priceTypeButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      minWidth: 80,
      alignItems: 'center',
    },
    priceTypeButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    priceTypeButtonText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    priceTypeButtonTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },
  });
