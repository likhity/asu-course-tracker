# ASU Course Tracker - React Native App

A modern React Native mobile application for tracking ASU courses, built with Expo and TypeScript. This app consumes the .NET backend API to provide course tracking functionality.

## Features

- 🔐 **Authentication**: User signup, login, and JWT token management
- 📚 **Course Management**: View, search, and manage courses
- 🏠 **Dashboard**: Home screen with recent courses and quick actions
- 👤 **User Profile**: Account management and settings
- 🔄 **Real-time Updates**: Automatic token refresh and API integration
- 📱 **Modern UI**: Beautiful, responsive design with Material Design principles

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Storage**: AsyncStorage for local data persistence
- **Icons**: Expo Vector Icons (Ionicons)
- **Styling**: React Native StyleSheet

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Emulator
- Your .NET backend running (default: `http://localhost:5000`)

## Installation & Setup

1. **Clone the repository** (if not already done):
   ```bash
   cd ASUCourseTrackerApp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   # Create your .env file (if not already created)
   cp .env.example .env
   
   # Update the API URL in .env if needed
   # EXPO_PUBLIC_API_URL=http://localhost:5246/api
   ```

4. **Backend Configuration**:
   - Ensure your .NET backend is running on the URL specified in your `.env` file
   - Default: `http://localhost:5246/api`

5. **Start the development server**:
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/simulator**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
│   └── AuthContext.tsx # Authentication state management
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx # Main navigation structure
├── screens/            # App screens
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   ├── HomeScreen.tsx
│   ├── CoursesScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── CourseDetailScreen.tsx
│   └── AddCourseScreen.tsx
├── services/           # API and external services
│   └── api.ts         # HTTP client and API endpoints
├── types/              # TypeScript type definitions
│   └── index.ts       # All app types and interfaces
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
└── constants/          # App constants and configuration
```

## API Integration

The app is designed to work with your .NET backend API. Key endpoints:

- **Authentication**: `/api/auth/signup`, `/api/auth/login`, `/api/auth/refresh`
- **Courses**: `/api/courses` (GET, POST, PUT, DELETE)
- **Course Tracking**: `/api/courses/{id}/track`

## Development

### Adding New Screens

1. Create a new screen component in `src/screens/`
2. Add the screen to navigation types in `src/types/index.ts`
3. Update `src/navigation/AppNavigator.tsx`

### Styling

The app uses a consistent design system:
- Primary color: `#1976d2` (Material Blue)
- Background: `#f5f5f5`
- Cards: `white` with subtle shadows
- Text: `#333` (primary), `#666` (secondary), `#999` (tertiary)

### State Management

- **Authentication**: Managed via `AuthContext`
- **API Calls**: Centralized in `apiService`
- **Local Storage**: AsyncStorage for tokens and user data

## Testing

To test the app:

1. **Start your .NET backend** and ensure it's running on the configured URL
2. **Run the app** and test the authentication flow
3. **Test course management** features
4. **Verify token refresh** by checking network requests

## Troubleshooting

### Common Issues

1. **API Connection Failed**:
   - Check if your .NET backend is running
   - Verify the `API_BASE_URL` in `src/services/api.ts`
   - Check network connectivity

2. **Navigation Errors**:
   - Ensure all screen components are properly exported
   - Check navigation type definitions

3. **Build Errors**:
   - Clear Metro cache: `npx expo start --clear`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

### Debug Mode

Enable debug mode by shaking your device or pressing `Cmd+D` (iOS) / `Cmd+M` (Android) in the simulator.

## Deployment

### Building for Production

1. **Configure app.json** with your app details
2. **Build the app**:
   ```bash
   expo build:android  # For Android
   expo build:ios      # For iOS
   ```

### App Store Deployment

1. **Configure signing** in `app.json`
2. **Build production version**
3. **Submit to App Store/Play Store**

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for new features
3. Test thoroughly before submitting changes
4. Update documentation as needed

## License

This project is part of the ASU Course Tracker system.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the .NET backend logs
3. Check Expo documentation: https://docs.expo.dev/

---

**Happy coding! 🚀**
