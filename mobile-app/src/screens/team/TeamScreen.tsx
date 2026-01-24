import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function TeamScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, [user]);

  const loadTeamMembers = async () => {
    if (!user?.id) return;

    try {
      const response = await apiService.getTeamMembers(user.id);
      setMembers(response.members || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeamMembers();
  };

  const handleDelete = (memberId: string) => {
    Alert.alert(
      'Delete Member',
      'Are you sure you want to delete this team member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTeamMember(memberId);
              loadTeamMembers();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete member');
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
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>{item.name || 'N/A'}</Text>
                <Text style={styles.memberRole}>{item.role || 'Team Member'}</Text>
                {item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
                {item.phone && <Text style={styles.memberPhone}>{item.phone}</Text>}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No team members yet</Text>
            <Text style={styles.emptySubtext}>Add team members to get started</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={styles.listContent}
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    listContent: {
      padding: theme.spacing.md,
    },
    memberCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    memberInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    memberDetails: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    memberRole: {
      fontSize: 14,
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    memberEmail: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    memberPhone: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    deleteButton: {
      padding: theme.spacing.sm,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
      marginTop: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      fontWeight: '600',
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
  });
