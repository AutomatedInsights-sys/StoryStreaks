import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Child } from '../types';
import { theme } from '../utils/theme';
import PinModal from '../components/shared/PinModal';

export default function ProfileSelectionScreen() {
  const { user, children, selectProfile, selectProfileWithPin, verifyPin, verifyPassword } = useAuth();
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleParentPress = () => {
    if (!user?.parent_pin) {
      // No PIN set, use password fallback
      setShowPasswordModal(true);
      return;
    }

    setShowPinModal(true);
  };

  const handleChildPress = (child: Child) => {
    selectProfile(child);
  };

  const handlePinVerify = async (pin: string): Promise<boolean> => {
    try {
      const isValid = await selectProfileWithPin(pin);
      if (isValid) {
        setShowPinModal(false);
      }
      return isValid;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  };

  const handlePasswordVerify = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }

    setIsVerifying(true);
    try {
      console.log('🔐 ProfileSelection: Starting password verification...');
      const isValid = await verifyPassword(password);
      console.log('🔐 ProfileSelection: Password verification result:', isValid);
      
      if (isValid) {
        console.log('🔐 ProfileSelection: Password valid, selecting parent profile...');
        // First close the modal and clear password
        setShowPasswordModal(false);
        setPassword('');
        // Password verification already sets PIN verification state, so we can use selectProfile
        selectProfile('parent');
        console.log('🔐 ProfileSelection: Parent profile selected, modal closed');
      } else {
        Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      Alert.alert('Error', 'An error occurred while verifying your password.');
    } finally {
      setIsVerifying(false);
    }
  };

  const renderParentCard = () => (
    <TouchableOpacity
      style={styles.profileCard}
      onPress={handleParentPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.profileName}>{user?.name || 'Parent'}</Text>
          <Text style={styles.profileRole}>Parent Mode</Text>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
      <Text style={styles.cardDescription}>
        Manage chores, approve completions, and view progress
        {!user?.parent_pin && (
          <Text style={styles.noPinNote}>
            {'\n'}💡 No PIN set - will use password
          </Text>
        )}
      </Text>
    </TouchableOpacity>
  );

  const renderChildCard = (child: Child) => (
    <TouchableOpacity
      key={child.id}
      style={styles.profileCard}
      onPress={() => handleChildPress(child)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.childIcon}>
            {child.world_theme === 'magical_forest' ? '🧚‍♀️' :
             child.world_theme === 'space_adventure' ? '🚀' :
             child.world_theme === 'underwater_kingdom' ? '🐠' : '👦'}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.profileName}>{child.name}</Text>
          <Text style={styles.profileRole}>Age {child.age}</Text>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
      <Text style={styles.cardDescription}>
        Complete chores and unlock stories in the {child.world_theme.replace('_', ' ')} world
      </Text>
      <View style={styles.childStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{child.current_streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{child.total_points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Who's using StoryStreaks?</Text>
        <Text style={styles.subtitle}>
          Choose a profile to get started
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profilesList}>
          {renderParentCard()}
          
          {children.length > 0 ? (
            children.map(renderChildCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Children Added</Text>
              <Text style={styles.emptyText}>
                Add your first child in parent mode to get started!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <PinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={handlePinVerify}
        title="Enter Parent PIN"
        subtitle="Enter your PIN to access parent features"
        showForgotPin={true}
        onForgotPin={() => {
          setShowPinModal(false);
          // This would handle forgot PIN - sign out and require re-login
          Alert.alert('Forgot PIN', 'To reset your PIN, you will need to sign out and sign back in.');
        }}
      />

      <Modal
        visible={showPasswordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.passwordModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Enter Password</Text>
                <Text style={styles.modalSubtitle}>
                  Enter your login password to access parent features
                </Text>
              </View>

              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={true}
                  autoFocus={true}
                  editable={!isVerifying}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                  }}
                  disabled={isVerifying}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    password.trim().length > 0 && !isVerifying
                      ? styles.verifyButtonActive
                      : styles.verifyButtonInactive,
                  ]}
                  onPress={handlePasswordVerify}
                  disabled={password.trim().length === 0 || isVerifying}
                >
                  <Text style={[
                    styles.verifyButtonText,
                    password.trim().length > 0 && !isVerifying
                      ? styles.verifyButtonTextActive
                      : styles.verifyButtonTextInactive,
                  ]}>
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.passwordHint}>
                <Text style={styles.hintText}>
                  💡 You can set a PIN in Settings for faster access next time
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profilesList: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  lockIcon: {
    fontSize: 24,
  },
  childIcon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  profileRole: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  noPinNote: {
    fontSize: 12,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  childStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Password Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  passwordModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  modalSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  passwordInputContainer: {
    marginBottom: theme.spacing.xl,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  verifyButtonInactive: {
    backgroundColor: theme.colors.border,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyButtonTextActive: {
    color: '#fff',
  },
  verifyButtonTextInactive: {
    color: theme.colors.textSecondary,
  },
  passwordHint: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
});
