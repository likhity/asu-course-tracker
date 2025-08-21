import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    // Background colors
    background: string;
    surface: string;
    card: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;
    
    // Primary colors (ASU Maroon)
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // Accent color (ASU Gold)
    accent: string;
    
    // Border and separator colors
    border: string;
    separator: string;
    
    // Status colors
    success: string;
    warning: string; // Uses ASU Gold
    error: string;
    
    // Special colors
    shadow: string;
    overlay: string;
  };
}

const lightTheme: Theme = {
  mode: 'light',
  isDark: false,
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    card: '#ffffff',
    
    text: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',
    
    primary: '#8C1D40',     // ASU Maroon
    primaryLight: 'rgba(140, 29, 64, 0.1)',
    primaryDark: '#6B1530',  // Darker Maroon
    
    accent: '#FFC627',       // ASU Gold
    
    border: '#e0e0e0',
    separator: '#f0f0f0',
    
    success: '#4caf50',
    warning: '#FFC627',      // ASU Gold
    error: '#d32f2f',
    
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  isDark: true,
  colors: {
    background: '#121212',
    surface: '#1e1e1e',
    card: '#2d2d2d',
    
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    textTertiary: '#808080',
    
    primary: '#B8336A',      // Lighter ASU Maroon for dark mode
    primaryLight: 'rgba(184, 51, 106, 0.1)',
    primaryDark: '#6B1530',  // Darker Maroon
    
    accent: '#FFD700',       // Brighter ASU Gold for dark mode
    
    border: '#404040',
    separator: '#333333',
    
    success: '#66bb6a',
    warning: '#FFD700',      // Brighter Gold for dark mode
    error: '#f44336',
    
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        if (savedThemeMode && ['light', 'dark', 'system'].includes(savedThemeMode)) {
          setThemeModeState(savedThemeMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Listen to system color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Save theme preference to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Toggle between light and dark (for quick toggle)
  const toggleTheme = () => {
    const currentTheme = getCurrentTheme();
    setThemeMode(currentTheme.isDark ? 'light' : 'dark');
  };

  // Determine current theme based on mode and system preference
  const getCurrentTheme = (): Theme => {
    let shouldUseDark = false;

    switch (themeMode) {
      case 'dark':
        shouldUseDark = true;
        break;
      case 'light':
        shouldUseDark = false;
        break;
      case 'system':
        shouldUseDark = systemColorScheme === 'dark';
        break;
    }

    const baseTheme = shouldUseDark ? darkTheme : lightTheme;
    return {
      ...baseTheme,
      mode: themeMode, // Keep the user's preference mode
    };
  };

  const theme = getCurrentTheme();

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
