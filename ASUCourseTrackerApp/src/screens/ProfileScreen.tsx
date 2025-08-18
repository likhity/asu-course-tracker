import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color={theme.colors.primary} />
        </View>
        <Text style={styles.name}>{user?.email?.split('@')[0]}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Last Login</Text>
          <Text style={styles.infoValue}>
            {user?.lastLoginAt ? 
              new Date(user.lastLoginAt).toLocaleDateString() + ' ' + 
              new Date(user.lastLoginAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : 'Never'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="notifications-outline" size={20} color="#666" />
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => navigation.navigate('ThemeSettings')}
        >
          <Ionicons name="moon-outline" size={20} color="#666" />
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="language-outline" size={20} color="#666" />
          <Text style={styles.settingLabel}>Language</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="help-circle-outline" size={20} color="#666" />
          <Text style={styles.settingLabel}>Help & FAQ</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="document-text-outline" size={20} color="#666" />
          <Text style={styles.settingLabel}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.copyrightText}>© 2025 ASU Course Tracker</Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primaryDark,
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    backgroundColor: theme.colors.card,
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButtonText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;
