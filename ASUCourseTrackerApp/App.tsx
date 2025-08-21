import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Initialize notifications when app starts
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        const cleanup = notificationService.setupNotificationListeners();
        
        // Return cleanup function
        return cleanup;
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    let cleanup: (() => void) | undefined;
    
    initializeNotifications().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="#8C1D40" />
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
