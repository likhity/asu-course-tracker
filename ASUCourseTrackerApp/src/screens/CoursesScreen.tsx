import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrackedCourseDto } from '../types';
import apiService from '../services/api';

type CoursesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Courses'>;

const CoursesScreen = () => {
  const [courses, setCourses] = useState<TrackedCourseDto[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<TrackedCourseDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<CoursesScreenNavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const loadCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedCourses = await apiService.getTrackedCourses();
      // Sort by lastUpdated in descending order (most recent first)
      const sortedCourses = fetchedCourses.sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
      setCourses(sortedCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh courses every time screen is focused
  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [loadCourses])
  );

  useEffect(() => {
    filterCourses();
  }, [searchQuery, courses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const filterCourses = () => {
    if (!searchQuery.trim()) {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course =>
        course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
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

  const navigateToAddCourse = () => {
    navigation.navigate('TrackCourse');
  };

  const getLastName = (fullName: string) => {
    const names = fullName.trim().split(' ');
    return names.length > 1 ? names[names.length - 1] : fullName;
  };

  const renderCourseItem = ({ item }: { item: TrackedCourseDto }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => navigateToCourseDetail(item)}
    >
      <View style={styles.courseHeader}>
        <Text style={styles.courseCode}>{item.courseCode}</Text>
        <Text style={styles.courseNumber}>#{item.courseNumber}</Text>
      </View>
      
      <Text style={styles.courseTitle} numberOfLines={2}>
        {item.courseTitle}
      </Text>
      
      <View style={styles.courseDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{getLastName(item.instructor)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.seatsOpen}</Text>
        </View>
      </View>
      
      <View style={styles.courseFooter}>
        <Text style={styles.lastUpdated}>
          Updated: {new Date(item.lastUpdated).toLocaleDateString()} {new Date(item.lastUpdated).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No courses found' : 'No tracked courses yet'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Start by tracking your first course'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.addFirstCourseButton} onPress={navigateToAddCourse}>
          <Text style={styles.addFirstCourseButtonText}>Track Course</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Tracked Courses</Text>
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddCourse}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCourses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.courseId.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: theme.colors.primaryDark,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    color: '#999',
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
    textAlign: 'center',
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
});

export default CoursesScreen;
