import { Theme } from '../types';

// CHOREY STORIES DESIGN LANGUAGE
// A magical twilight storybook experience - warm as firelight, mysterious as twilight

export const theme: Theme = {
  colors: {
    // Brand Colors - Phoenix & Sunset
    primary: '#FF8C42', // Phoenix Orange - main CTAs and accents
    secondary: '#FFB347', // Sunset Gold - highlights and warm touches

    // Backgrounds - Twilight & Sky
    background: '#FFF4E6', // Starlight - light backgrounds, reading surfaces
    surface: '#FFFFFF', // Pure white for cards

    // Text Colors
    text: '#1A2332', // Deep Navy - primary text
    textSecondary: '#64748B', // Muted gray - secondary text

    // Semantic Colors
    success: '#4ADE80', // Achievements, completed
    warning: '#FBBF24', // Alerts, attention needed
    error: '#FF6B6B', // Coral - errors, important highlights

    // Borders & Accents
    border: 'rgba(255, 140, 66, 0.1)', // Subtle orange tint

    // Dark Mode Colors (for future use)
    darkBackground: '#1A2332', // Deep Navy
    darkSurface: '#2D3E50', // Twilight Blue
  },
  fonts: {
    // Warm, friendly, rounded typography
    regular: 'System', // Will use Poppins/Nunito when custom fonts loaded
    bold: 'System',
    large: 'System',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
};

// STORY WORLD THEMES - Warm and magical palettes
export const storyWorldThemes = {
  magical_forest: {
    primary: '#27AE60', // Forest emerald
    secondary: '#52C77B', // Bright leaf green
    accent: '#FFB347', // Sunset gold accent
    background: '#F0FFF4', // Misty morning green
    gradient: ['#27AE60', '#FFB347'], // Forest to sunset
    shadow: 'rgba(39, 174, 96, 0.2)',
  },
  space_adventure: {
    primary: '#4FACFE', // Sky blue
    secondary: '#00C9FF', // Aqua glow
    accent: '#B794F6', // Purple mist
    background: '#B8E6F5', // Soft cyan
    gradient: ['#4FACFE', '#00C9FF'], // Sky gradient
    shadow: 'rgba(79, 172, 254, 0.2)',
  },
  underwater_kingdom: {
    primary: '#4FACFE', // Sky blue
    secondary: '#00C9FF', // Aqua glow
    accent: '#FF8C42', // Phoenix orange accent
    background: '#B8E6F5', // Soft cyan
    gradient: ['#00C9FF', '#B8E6F5'], // Aqua gradient
    shadow: 'rgba(0, 201, 255, 0.2)',
  },
};

// CHOREY STORIES GRADIENTS
export const gradients = {
  sunset: 'linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)',
  sunsetExtended: 'linear-gradient(135deg, #FF8C42 0%, #FFB347 50%, #FFD8B8 100%)',
  sky: 'linear-gradient(135deg, #4FACFE 0%, #00C9FF 100%)',
  skyVertical: 'linear-gradient(180deg, #1A2332 0%, #2D3E50 50%, #4FACFE 100%)',
  magic: 'linear-gradient(135deg, #FF8C42 0%, #4FACFE 100%)',
  backgroundLight: 'linear-gradient(180deg, #B8E6F5, #FFF4E6)',
  backgroundDark: 'linear-gradient(180deg, #1A2332, #2D3E50)',
  peachCyan: 'linear-gradient(135deg, #FFD8B8, #B8E6F5)',
};

// Age-appropriate font sizes - Larger for readability, magical for engagement
export const fontSizes = {
  '4-6': {
    small: 18,
    medium: 22,
    large: 28,
    extraLarge: 38,
    title: 42,
  },
  '7-8': {
    small: 16,
    medium: 20,
    large: 24,
    extraLarge: 32,
    title: 36,
  },
  '9-10': {
    small: 14,
    medium: 18,
    large: 22,
    extraLarge: 28,
    title: 32,
  },
};

// Helper function to get age-appropriate font size
export const getFontSize = (ageBracket: '4-6' | '7-8' | '9-10', size: 'small' | 'medium' | 'large' | 'extraLarge' | 'title') => {
  return fontSizes[ageBracket][size];
};

// Helper function to get story world colors
export const getStoryWorldColors = (worldTheme: string) => {
  return storyWorldThemes[worldTheme as keyof typeof storyWorldThemes] || storyWorldThemes.magical_forest;
};

// CHOREY STORIES SHADOWS - Warm and magical
export const shadows = {
  small: {
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 8,
  },
  // Magical glows
  glowOrange: {
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
  },
  glowBlue: {
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
  },
  buttonOrange: {
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
};

// CHOREY STORIES BORDER RADIUS
export const borderRadius = {
  small: 12,
  medium: 16,
  large: 20,
  button: 12, // For buttons
  buttonPill: 32, // For pill buttons
  avatar: 9999, // Full round
};
