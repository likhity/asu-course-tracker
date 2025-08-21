import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrackedCourseDto } from '../types';
import apiService from '../services/api';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [recentCourses, setRecentCourses] = useState<TrackedCourseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreCourses, setHasMoreCourses] = useState(false);

  const loadRecentCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const courses = await apiService.getTrackedCourses();
      // Sort by lastUpdated in descending order (most recent first) and show only the first 3
      const sortedCourses = courses.sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
      setHasMoreCourses(sortedCourses.length > 3);
      setRecentCourses(sortedCourses.slice(0, 3));
    } catch (error) {
      console.error('Error loading recent courses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh courses every time screen is focused
  useFocusEffect(
    useCallback(() => {
      loadRecentCourses();
    }, [loadRecentCourses])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentCourses();
    setRefreshing(false);
  };

  const navigateToCourses = () => {
    navigation.navigate('Courses');
  };

  const navigateToTrackCourse = () => {
    navigation.navigate('TrackCourse');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getLastName = (fullName: string) => {
    const names = fullName.trim().split(' ');
    return names.length > 1 ? names[names.length - 1] : fullName;
  };

  const navigateToCourseDetail = (course: TrackedCourseDto) => {
    // Convert TrackedCourseDto to CourseDto for the detail screen
    const courseDto = {
      id: course.courseId,
      number: course.courseNumber,
      courseCode: course.courseCode,
      title: course.courseTitle,
      instructor: course.instructor,
      seatsOpen: course.seatsOpen,
      lastUpdated: course.lastUpdated,
      description: undefined,
      semester: undefined,
    };
    navigation.navigate('CourseDetail', { course: courseDto });
  };

  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContainer,
        { paddingTop: 0 }
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.greeting}>{getGreeting()}, {user?.email?.split('@')[0]}!</Text>
        <Text style={styles.subtitle}>Welcome to ASU Course Tracker!</Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToCourses}>
            <Ionicons name="book-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>View Courses</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={navigateToTrackCourse}>
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Track Course</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recentCourses}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tracked Courses</Text>
          <TouchableOpacity onPress={navigateToCourses}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading courses...</Text>
          </View>
        ) : recentCourses.length > 0 ? (
          <View style={styles.coursesContainer}>
            {recentCourses.map((course) => (
              <TouchableOpacity 
                key={course.courseId} 
                style={styles.courseCard}
                onPress={() => navigateToCourseDetail(course)}
              >
                <View style={styles.courseHeader}>
                  <Text style={styles.courseCode}>{course.courseCode}</Text>
                  <Text style={styles.courseNumber}>#{course.courseNumber}</Text>
                </View>
                
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {course.courseTitle}
                </Text>
                
                <View style={styles.courseDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{getLastName(course.instructor)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{course.seatsOpen}</Text>
                  </View>
                </View>
                
                <View style={styles.courseFooter}>
                  <Text style={styles.lastUpdated}>
                    Updated: {formatDate(course.lastUpdated)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </View>
              </TouchableOpacity>
            ))}
            
            {hasMoreCourses && (
              <>
                <LinearGradient
                  colors={['transparent', `${theme.colors.background}80`, theme.colors.background]}
                  style={styles.fadeOverlay}
                  pointerEvents="none"
                />
                <TouchableOpacity 
                  style={styles.seeAllButton}
                  onPress={() => navigation.navigate('Courses' as any)}
                >
                  <Text style={styles.seeAllText}>See All Courses</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No tracked courses yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start by tracking your first course
            </Text>
            <TouchableOpacity style={styles.addFirstCourseButton} onPress={navigateToTrackCourse}>
              <Text style={styles.addFirstCourseButtonText}>Track Your First Course</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.stats}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color={theme.colors.success} />
            <Text style={styles.statNumber}>{recentCourses.length}</Text>
            <Text style={styles.statLabel}>Tracked Courses</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color={theme.colors.warning} />
            <Text style={styles.statNumber}>10</Text>
            <Text style={styles.statLabel}>Min Check Interval</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: theme.colors.primaryDark,
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.48,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  recentCourses: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  coursesContainer: {
    position: 'relative',
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  courseCard: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  courseNumber: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  courseDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addFirstCourseButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  addFirstCourseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  stats: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.48,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default HomeScreen;
