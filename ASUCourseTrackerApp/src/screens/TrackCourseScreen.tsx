import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import apiService from '../services/api';

type TrackCourseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TrackCourse'>;

const TrackCourseScreen = () => {
  const [courseNumber, setCourseNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  
  const navigation = useNavigation<TrackCourseScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleTrackCourse = async () => {
    if (!courseNumber.trim()) {
      Alert.alert('Error', 'Please enter a course number');
      return;
    }

    try {
      setIsLoading(true);
      await apiService.trackCourse(courseNumber.trim());
      Alert.alert('Success', 'Course tracked successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset navigation stack and go back to main tab navigator
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data || error.message || 'Failed to track course'
      );
    } finally {
      setIsLoading(false);
    }
  };

    const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <Ionicons name="add-circle-outline" size={80} color={theme.colors.primary} />
          <Text style={styles.title}>Track Course</Text>
          <Text style={styles.subtitle}>Enter the course number to start tracking</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="book-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Course Number (e.g., 70330)"
              placeholderTextColor={theme.colors.textSecondary}
              value={courseNumber}
              onChangeText={setCourseNumber}
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.trackButton, isLoading && styles.trackButtonDisabled]}
            onPress={handleTrackCourse}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.trackButtonText}>Tracking Course...</Text>
            ) : (
              <Text style={styles.trackButtonText}>Track Course</Text>
            )}
          </TouchableOpacity>

          <View style={styles.info}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              You'll receive notifications when seats become available for this course.
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  trackButton: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  trackButtonDisabled: {
    backgroundColor: theme.colors.textTertiary,
  },
  trackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default TrackCourseScreen;
