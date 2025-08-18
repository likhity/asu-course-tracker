import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList, MainTabParamList } from '../types';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import TrackCourseScreen from '../screens/TrackCourseScreen';
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';

// Import icons
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = ({ theme }: { theme: any }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Courses') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
        // Hide tab bar on web for better UX
        tabBarStyle: Platform.OS === 'web' ? { display: 'none' } : {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    // You could show a splash screen here
    return null;
  }

  const navigationTheme = {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900' as const,
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          // Better web support
          headerMode: Platform.OS === 'web' ? 'screen' : 'float',
        }}
      >
        {isAuthenticated ? (
          // Authenticated stack
          <>
            <Stack.Screen name="Main">
              {() => <MainTabNavigator theme={theme} />}
            </Stack.Screen>
            <Stack.Screen 
              name="CourseDetail" 
              component={CourseDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="TrackCourse" 
              component={TrackCourseScreen}
              options={{ headerShown: true, title: 'Track Course' }}
            />
            <Stack.Screen 
              name="ThemeSettings" 
              component={ThemeSettingsScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Auth stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
