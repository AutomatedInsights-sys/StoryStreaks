import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';
import { Child } from '../../types';
import PinModal from './PinModal';

interface ProfileSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileSwitcher({ visible, onClose }: ProfileSwitcherProps) {
  const { 
    user, 
    children, 
    selectedProfile, 
    selectProfile, 
    selectProfileWithPin,
    verifyPin, 
    isPinVerified,
    checkPinTimeout 
  } = useAuth();
  
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<'parent' | Child | null>(null);

  const handleProfileSelect = (profile: 'parent' | Child) => {
    if (profile === 'parent') {
      // Always require PIN verification when switching to parent for security
      setPendingProfile('parent');
      setShowPinModal(true);
      // Close the profile switcher modal to avoid modal conflicts
      onClose();
    } else {
      // Child profile - no PIN required
      selectProfile(profile);
      onClose();
    }
  };

  const handlePinVerify = async (pin: string): Promise<boolean> => {
    if (pendingProfile === 'parent') {
      // Use the special method for parent profile with PIN
      const isValid = await selectProfileWithPin(pin);
      if (isValid) {
        onClose();
      }
      setShowPinModal(false);
      setPendingProfile(null);
      return isValid;
    } else {
      // For other profiles, use regular verification
      const isValid = await verifyPin(pin);
      if (isValid && pendingProfile) {
        selectProfile(pendingProfile);
        onClose();
      }
      setShowPinModal(false);
      setPendingProfile(null);
      return isValid;
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPendingProfile(null);
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Forgot PIN?',
      'To reset your PIN, you will need to sign out and sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => {
          // This would trigger sign out - for now just close
          onClose();
        }},
      ]
    );
  };

  const getCurrentProfileName = () => {
    if (selectedProfile === 'parent') {
      return user?.name || 'Parent';
    } else if (selectedProfile) {
      return selectedProfile.name;
    }
    return 'Select Profile';
  };

  const getCurrentProfileType = () => {
    if (selectedProfile === 'parent') {
      return 'Parent';
    } else if (selectedProfile) {
      return 'Child';
    }
    return '';
  };

  const renderProfileOption = ({ item }: { item: 'parent' | Child }) => {
    const isParent = item === 'parent';
    const isSelected = selectedProfile === item;
    const name = isParent ? (user?.name || 'Parent') : item.name;
    const type = isParent ? 'Parent' : 'Child';

    return (
      <TouchableOpacity
        style={[
          styles.profileOption,
          isSelected && styles.profileOptionSelected,
        ]}
        onPress={() => handleProfileSelect(item)}
      >
        <View style={styles.profileInfo}>
          <Text style={[
            styles.profileName,
            isSelected && styles.profileNameSelected,
          ]}>
            {name}
          </Text>
          <Text style={[
            styles.profileType,
            isSelected && styles.profileTypeSelected,
          ]}>
            {type}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIcon}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const profileOptions: ('parent' | Child)[] = [
    'parent',
    ...children,
  ];

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.container}>
            <View style={styles.modal}>
              <View style={styles.header}>
                <Text style={styles.title}>Switch Profile</Text>
                <Text style={styles.subtitle}>
                  Currently: {getCurrentProfileName()} ({getCurrentProfileType()})
                </Text>
              </View>

              <FlatList
                data={profileOptions}
                keyExtractor={(item) => item === 'parent' ? 'parent' : item.id}
                renderItem={renderProfileOption}
                style={styles.profileList}
                showsVerticalScrollIndicator={false}
              />

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <PinModal
        visible={showPinModal}
        onClose={handlePinModalClose}
        onVerify={handlePinVerify}
        title="Enter PIN"
        subtitle="Enter your PIN to switch to parent profile"
        showForgotPin={true}
        onForgotPin={handleForgotPin}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: theme.spacing.xl,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  profileList: {
    maxHeight: 300,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  profileOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  profileNameSelected: {
    color: theme.colors.primary,
  },
  profileType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  profileTypeSelected: {
    color: theme.colors.primary,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
});
