import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { theme } from '../utils/theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/ChoreyStoriesLogo.jpeg')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.text}>Loading StoryStreaks...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.xl,
    borderRadius: 20,
  },
  text: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
