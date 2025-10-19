import { Theme } from '../types';

export const theme: Theme = {
  colors: {
    primary: '#4F46E5', // Indigo
    secondary: '#06B6D4', // Cyan
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF',
    text: '#1E293B', // Slate 800
    textSecondary: '#64748B', // Slate 500
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    error: '#EF4444', // Red 500
    border: '#E2E8F0', // Slate 200
  },
  fonts: {
    regular: 'System',
    bold: 'System',
    large: 'System',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

// Story world themes
export const storyWorldThemes = {
  magical_forest: {
    primary: '#059669', // Emerald 600
    secondary: '#10B981', // Emerald 500
    accent: '#D97706', // Amber 600
    background: '#F0FDF4', // Green 50
  },
  space_adventure: {
    primary: '#7C3AED', // Violet 600
    secondary: '#8B5CF6', // Violet 500
    accent: '#06B6D4', // Cyan 500
    background: '#F8FAFC', // Slate 50
  },
  underwater_kingdom: {
    primary: '#0369A1', // Sky 700
    secondary: '#0EA5E9', // Sky 500
    accent: '#06B6D4', // Cyan 500
    background: '#F0F9FF', // Sky 50
  },
};

// Age-appropriate font sizes
export const fontSizes = {
  '4-6': {
    small: 16,
    medium: 20,
    large: 24,
    extraLarge: 32,
  },
  '7-8': {
    small: 14,
    medium: 18,
    large: 22,
    extraLarge: 28,
  },
  '9-10': {
    small: 12,
    medium: 16,
    large: 20,
    extraLarge: 24,
  },
};

// Helper function to get age-appropriate font size
export const getFontSize = (ageBracket: '4-6' | '7-8' | '9-10', size: 'small' | 'medium' | 'large' | 'extraLarge') => {
  return fontSizes[ageBracket][size];
};

// Helper function to get story world colors
export const getStoryWorldColors = (worldTheme: string) => {
  return storyWorldThemes[worldTheme as keyof typeof storyWorldThemes] || storyWorldThemes.magical_forest;
};
