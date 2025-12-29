import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../utils/theme';
import PinSetup from '../../components/shared/PinSetup';
import { getRandomThemeImage, THEME_IMAGES } from '../../constants/themeImages';
import { StoryWorld } from '../../types';
import { backfillCoverImages } from '../../scripts/backfillCoverImages';

export default function SettingsScreen() {
  const { signOut, user, setParentPin, verifyPin } = useAuth();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [testResult, setTestResult] = useState<{
    theme: StoryWorld;
    imageUrl: string;
    allImagesForTheme: string[];
  } | null>(null);

  const testPremiumCoverImage = () => {
    setIsTesting(true);
    setTestResult(null);
    
    // Test all three themes
    const themes: StoryWorld[] = ['magical_forest', 'space_adventure', 'underwater_kingdom'];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    
    try {
      const imageUrl = getRandomThemeImage(randomTheme);
      const allImages = THEME_IMAGES[randomTheme] || [];
      
      setTestResult({
        theme: randomTheme,
        imageUrl,
        allImagesForTheme: allImages,
      });
      
      if (imageUrl) {
        Alert.alert(
          '✅ Premium Cover Test Passed!',
          `Theme: ${randomTheme.replace('_', ' ')}\n\nImage URL was successfully generated.\n\nThe image should appear below.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ Premium Cover Test Failed',
          `No image URL was returned for theme: ${randomTheme}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        '❌ Test Error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testAllThemes = () => {
    const themes: StoryWorld[] = ['magical_forest', 'space_adventure', 'underwater_kingdom'];
    const results: string[] = [];
    
    for (const themeKey of themes) {
      const images = THEME_IMAGES[themeKey] || [];
      const randomImage = getRandomThemeImage(themeKey);
      results.push(`${themeKey.replace('_', ' ')}:\n  - ${images.length} images available\n  - Random pick: ${randomImage ? '✅' : '❌'}`);
    }
    
    Alert.alert(
      '🖼️ Premium Cover Image Test',
      results.join('\n\n'),
      [{ text: 'OK' }]
    );
  };

  const runBackfillCoverImages = async () => {
    Alert.alert(
      '🖼️ Backfill Cover Images',
      'This will add premium cover images to all existing books and chapters that don\'t have one. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Backfill',
          onPress: async () => {
            setIsBackfilling(true);
            try {
              const result = await backfillCoverImages();
              Alert.alert(
                '✅ Backfill Complete!',
                `Books updated: ${result.booksUpdated}\nChapters updated: ${result.chaptersUpdated}${result.errors.length > 0 ? `\n\nErrors: ${result.errors.length}` : ''}`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert(
                '❌ Backfill Failed',
                `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                [{ text: 'OK' }]
              );
            } finally {
              setIsBackfilling(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSetPin = async (pin: string): Promise<boolean> => {
    return await setParentPin(pin);
  };

  const handleChangePin = async (currentPin: string, newPin: string): Promise<boolean> => {
    // First verify current PIN
    const isValid = await verifyPin(currentPin);
    if (!isValid) {
      return false;
    }
    // Then set new PIN
    return await setParentPin(newPin);
  };

  const handleVerifyCurrentPin = async (pin: string): Promise<boolean> => {
    return await verifyPin(pin);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Parent PIN</Text>
              <Text style={styles.settingDescription}>
                {user?.parent_pin ? 'PIN is set' : 'No PIN set - set one to protect parent features'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setShowPinSetup(!showPinSetup)}
            >
              <Text style={styles.settingButtonText}>
                {user?.parent_pin ? 'Change PIN' : 'Set PIN'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPinSetup && (
            <PinSetup
              onSetPin={handleSetPin}
              onChangePin={handleChangePin}
              existingPin={!!user?.parent_pin}
              onVerifyCurrentPin={handleVerifyCurrentPin}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Developer Tools Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Developer Tools</Text>
          <Text style={styles.devDescription}>
            Test features during development
          </Text>
          
          <View style={styles.devButtonRow}>
            <TouchableOpacity
              style={[styles.devButton, isTesting && styles.devButtonDisabled]}
              onPress={testPremiumCoverImage}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.devButtonText}>🖼️ Test Random Cover</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.devButton}
              onPress={testAllThemes}
            >
              <Text style={styles.devButtonText}>📊 Test All Themes</Text>
            </TouchableOpacity>
          </View>
          
          {/* Backfill Button */}
          <TouchableOpacity
            style={[styles.backfillButton, isBackfilling && styles.devButtonDisabled]}
            onPress={runBackfillCoverImages}
            disabled={isBackfilling}
          >
            {isBackfilling ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.devButtonText}>🔄 Backfill Cover Images</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.backfillDescription}>
            Add premium covers to existing books/chapters without images
          </Text>
          
          {testResult && (
            <View style={styles.testResultContainer}>
              <Text style={styles.testResultTitle}>Test Result:</Text>
              <Text style={styles.testResultText}>
                Theme: {testResult.theme.replace('_', ' ')}
              </Text>
              <Text style={styles.testResultText}>
                Available images: {testResult.allImagesForTheme.length}
              </Text>
              
              {testResult.imageUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Text style={styles.testResultText}>Preview:</Text>
                  <Image
                    source={{ uri: testResult.imageUrl }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.viewUrlButton}
                    onPress={() => {
                      Alert.alert('Image URL', testResult.imageUrl, [
                        { text: 'Copy', onPress: () => {} },
                        { text: 'Open in Browser', onPress: () => Linking.openURL(testResult.imageUrl) },
                        { text: 'OK' },
                      ]);
                    }}
                  >
                    <Text style={styles.viewUrlButtonText}>View Full URL</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.testResultError}>❌ No image URL generated</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    letterSpacing: -0.5,
  },
  userInfo: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 8,
    marginBottom: theme.spacing.xl,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  settingButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 6,
  },
  settingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Developer Tools Styles
  devDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  devButtonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  devButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  devButtonDisabled: {
    opacity: 0.6,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testResultContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  testResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  testResultText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  testResultError: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
  },
  imagePreviewContainer: {
    marginTop: theme.spacing.md,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  viewUrlButton: {
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    padding: theme.spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewUrlButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  backfillButton: {
    backgroundColor: '#10B981',
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: theme.spacing.sm,
  },
  backfillDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
