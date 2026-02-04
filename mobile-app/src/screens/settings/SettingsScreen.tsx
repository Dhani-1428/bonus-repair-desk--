import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { user, logout, updateUser } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    shopName: user?.shopName || '',
    contactNumber: user?.contactNumber || '',
    address: user?.address || '',
    companyEmail: user?.companyEmail || '',
    website: user?.website || '',
  });

  useEffect(() => {
    loadUserDetails();
  }, []);

  const loadUserDetails = async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getUser(user.id);
      if (response.user) {
        setUserData({
          name: response.user.name || '',
          email: response.user.email || '',
          shopName: response.user.shopName || '',
          contactNumber: response.user.contactNumber || '',
          address: response.user.address || '',
          companyEmail: response.user.companyEmail || '',
          website: response.user.website || '',
        });
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      await apiService.updateUser(user.id, userData);
      updateUser(userData as any);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <FormInput
          label="Name"
          value={userData.name}
          onChangeText={(text) => setUserData({ ...userData, name: text })}
        />
        <FormInput
          label="Email"
          value={userData.email}
          onChangeText={(text) => setUserData({ ...userData, email: text })}
          keyboardType="email-address"
          editable={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        <FormInput
          label="Shop Name"
          value={userData.shopName}
          onChangeText={(text) => setUserData({ ...userData, shopName: text })}
        />
        <FormInput
          label="Contact Number"
          value={userData.contactNumber}
          onChangeText={(text) => setUserData({ ...userData, contactNumber: text })}
          keyboardType="phone-pad"
        />
        <FormInput
          label="Address"
          value={userData.address}
          onChangeText={(text) => setUserData({ ...userData, address: text })}
          multiline
          numberOfLines={2}
        />
        <FormInput
          label="Company Email"
          value={userData.companyEmail}
          onChangeText={(text) => setUserData({ ...userData, companyEmail: text })}
          keyboardType="email-address"
        />
        <FormInput
          label="Website"
          value={userData.website}
          onChangeText={(text) => setUserData({ ...userData, website: text })}
          keyboardType="url"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>PanelPro Mobile v1.0.0</Text>
      </View>
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
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
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
          color: editable ? theme.colors.text : theme.colors.textSecondary,
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
        editable={editable}
      />
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
    saveButton: {
      backgroundColor: theme.colors.primary,
      marginHorizontal: 20,
      marginVertical: theme.spacing.lg,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.lg,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.error,
      gap: theme.spacing.sm,
    },
    logoutButtonText: {
      color: theme.colors.error,
      fontSize: 16,
      fontWeight: '600',
    },
    footer: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    footerText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
    },
  });
