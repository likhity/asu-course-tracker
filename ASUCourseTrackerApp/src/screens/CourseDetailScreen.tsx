import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList, CourseDto } from '../types';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import apiService from '../services/api';

type CourseDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CourseDetail'>;
type CourseDetailScreenRouteProp = StackScreenProps<RootStackParamList, 'CourseDetail'>['route'];

const CourseDetailScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [courseData, setCourseData] = useState<CourseDto | null>(null);
  const { theme } = useTheme();
  const navigation = useNavigation<CourseDetailScreenNavigationProp>();
  const route = useRoute<CourseDetailScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { course } = route.params;

  const fetchCourseData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const fullCourseData = await apiService.getCourse(course.number);
      setCourseData(fullCourseData);
    } catch (error) {
      console.error('Failed to fetch course details:', error);
      // Fallback to the course data passed via navigation
      setCourseData(course);
    } finally {
      setIsLoadingData(false);
    }
  }, [course.number, course]);

  // Refresh course data every time screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCourseData();
    }, [fetchCourseData])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (seatsOpen: string) => {
    const seats = seatsOpen.toLowerCase();
    
    // Handle new format: "X of Y open seats"
    const match = seats.match(/(\d+)\s+of\s+\d+\s+open\s+seats/);
    if (match) {
      const availableSeats = parseInt(match[1]);
      if (availableSeats === 0) return '#d32f2f'; // Red for no seats
      if (availableSeats < 5) return '#ff9800';   // Orange for few seats
      return '#4caf50';                           // Green for available seats
    }
    
    // Fallback for old formats
    if (seats.includes('closed') || seats === '0') return '#d32f2f';
    if (seats.includes('few') || parseInt(seats) < 5) return '#ff9800';
    return '#4caf50';
  };

  const getStatusIcon = (seatsOpen: string) => {
    const seats = seatsOpen.toLowerCase();
    
    // Handle new format: "X of Y open seats"
    const match = seats.match(/(\d+)\s+of\s+\d+\s+open\s+seats/);
    if (match) {
      const availableSeats = parseInt(match[1]);
      if (availableSeats === 0) return 'close-circle';   // X icon for no seats
      if (availableSeats < 5) return 'warning';          // Warning icon for few seats
      return 'checkmark-circle';                         // Check icon for available seats
    }
    
    // Fallback for old formats
    if (seats.includes('closed') || seats === '0') return 'close-circle';
    if (seats.includes('few') || parseInt(seats) < 5) return 'warning';
    return 'checkmark-circle';
  };

  const handleStopTracking = () => {
    const currentCourse = courseData || course;
    Alert.alert(
      'Stop Tracking Course',
      `Are you sure you want to stop tracking ${currentCourse.courseCode}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Stop Tracking',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await apiService.untrackCourse(currentCourse.number);
              Alert.alert('Success', 'Course tracking stopped', [
                {
                  text: 'OK',
                  onPress: () => {
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
                error.response?.data || error.message || 'Failed to stop tracking course'
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const displayCourse = courseData || course;
  const styles = createStyles(theme);

  if (isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        {/* Fixed Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Details</Text>
          <View style={styles.backButton} />
        </View>
        <View style={[styles.loadingContent, { paddingTop: insets.top + 80 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading course details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Details</Text>
        <View style={styles.backButton} />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 80 }]}
      >
        <View style={styles.content}>
        {/* Course Header */}
        <View style={styles.courseHeader}>
          <View style={styles.courseCodeContainer}>
            <Text style={styles.courseCode}>{displayCourse.courseCode}</Text>
            <Text style={styles.courseNumber}>#{displayCourse.number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(displayCourse.seatsOpen) }]}>
            <Ionicons 
              name={getStatusIcon(displayCourse.seatsOpen)} 
              size={16} 
              color="white" 
            />
            <Text style={styles.statusText}>{displayCourse.seatsOpen}</Text>
          </View>
        </View>

        {/* Course Title */}
        <Text style={styles.courseTitle}>{displayCourse.title}</Text>

        {/* Course Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Course Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Instructor</Text>
            <Text style={styles.infoValue}>{displayCourse.instructor}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Semester</Text>
            <Text style={styles.infoValue}>{displayCourse.semester || 'Not specified'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>{formatDate(displayCourse.lastUpdated)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Seats Available</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(displayCourse.seatsOpen) }]}>
              {displayCourse.seatsOpen}
            </Text>
          </View>
        </View>

        {/* Course Description */}
        {displayCourse.description && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{displayCourse.description}</Text>
          </View>
        )}

        {/* Tracking Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Tracking Status</Text>
          <View style={styles.trackingInfo}>
            <Ionicons name="notifications" size={24} color="#4caf50" />
            <Text style={styles.trackingText}>
              You're actively tracking this course. You'll receive notifications when seats become available.
            </Text>
          </View>
        </View>

        {/* Stop Tracking Button */}
        <TouchableOpacity
          style={[styles.stopTrackingButton, isLoading && styles.stopTrackingButtonDisabled]}
          onPress={handleStopTracking}
          disabled={isLoading}
        >
          <Ionicons name="stop-circle-outline" size={20} color={theme.colors.error} />
          <Text style={styles.stopTrackingButtonText}>
            {isLoading ? 'Stopping...' : 'Stop Tracking Course'}
          </Text>
        </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1000,
    elevation: 5, // Android shadow
    shadowColor: theme.colors.shadow, // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
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
    padding: 20,
    paddingTop: 20, // Add some breathing room below the header
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  courseCodeContainer: {
    flex: 1,
  },
  courseCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  courseNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 24,
    lineHeight: 28,
  },
  infoSection: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    padding: 16,
    borderRadius: 8,
  },
  trackingText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  stopTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
    marginTop: 16,
    marginBottom: 32,
  },
  stopTrackingButtonDisabled: {
    opacity: 0.6,
  },
  stopTrackingButtonText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CourseDetailScreen;
