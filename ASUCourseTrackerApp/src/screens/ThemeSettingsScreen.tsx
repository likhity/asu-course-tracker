import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';

const ThemeSettingsScreen = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const themeOptions = [
    {
      id: 'light',
      title: 'Light Mode',
      description: 'Always use light theme',
      icon: 'sunny-outline',
    },
    {
      id: 'dark',
      title: 'Dark Mode', 
      description: 'Always use dark theme',
      icon: 'moon-outline',
    },
    {
      id: 'system',
      title: 'System Setting',
      description: 'Follow your device\'s appearance setting',
      icon: 'phone-portrait-outline',
    },
  ] as const;

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theme Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionDescription}>
            Choose how the app should look
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                themeMode === option.id && styles.selectedOptionCard,
              ]}
              onPress={() => handleThemeSelect(option.id as ThemeMode)}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <View style={[
                    styles.iconContainer,
                    themeMode === option.id && styles.selectedIconContainer,
                  ]}>
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={themeMode === option.id ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[
                      styles.optionTitle,
                      themeMode === option.id && styles.selectedOptionTitle,
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                
                {themeMode === option.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={theme.colors.primary}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewHeaderText}>Sample Course</Text>
              <Text style={styles.previewHeaderSubtext}>CSE 310</Text>
            </View>
            <Text style={styles.previewTitle}>Data Structures and Algorithms</Text>
            <View style={styles.previewDetails}>
              <View style={styles.previewDetailRow}>
                <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.previewDetailText}>Professor Smith</Text>
              </View>
              <View style={styles.previewDetailRow}>
                <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.previewDetailText}>15 seats</Text>
              </View>
            </View>
            <Text style={styles.previewFooter}>
              Updated: Today, 2:30 PM
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOptionCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedIconContainer: {
    backgroundColor: theme.colors.primaryLight,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  selectedOptionTitle: {
    color: theme.colors.primary,
  },
  optionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  previewSection: {
    marginTop: 16,
  },
  previewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  previewHeaderSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  previewDetails: {
    marginBottom: 12,
  },
  previewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewDetailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  previewFooter: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
});

export default ThemeSettingsScreen;
