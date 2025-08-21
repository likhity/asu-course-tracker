import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiService from './api';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize notifications and get permission
   */
  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    // Check if we already have permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If no permission, request it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.expoPushToken = tokenData.data;
      console.log('Expo Push Token:', this.expoPushToken);
      
      // Note: Token will be registered with backend after user login
      // This prevents 401 errors when app starts before authentication
      
      return this.expoPushToken;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register the current token with backend (call after user login)
   */
  async registerWithBackend(): Promise<boolean> {
    if (!this.expoPushToken) {
      console.warn('No push token available to register');
      return false;
    }

    try {
      await apiService.registerPushToken(this.expoPushToken);
      console.log('Push token registered with backend');
      return true;
    } catch (error) {
      console.error('Failed to register push token:', error);
      return false;
    }
  }

  /**
   * Register the push token with your backend (private helper)
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await apiService.registerPushToken(token);
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners() {
    // Handle notification received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification response (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.type === 'seat_change' && data?.course_code) {
        // Navigate to course detail screen
        // You can implement navigation logic here
        console.log(`Navigate to course: ${data.course_code}`);
      }
    });

    // Return cleanup function
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  /**
   * Send a test notification via your backend
   */
  async sendTestNotification(): Promise<void> {
    try {
      await apiService.sendTestNotification();
      console.log('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Unregister push token
   */
  async unregister(): Promise<void> {
    try {
      await apiService.unregisterPushToken();
      this.expoPushToken = null;
      console.log('Push token unregistered');
    } catch (error) {
      console.error('Failed to unregister push token:', error);
      throw error;
    }
  }

  /**
   * Get the current push token
   */
  getCurrentToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(title: string, body: string, seconds: number = 5): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'local_test' },
      },
      trigger: { seconds },
    });
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification permissions status
   */
  async getPermissionStatus(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }
}

export const notificationService = new NotificationService();
export default notificationService;

