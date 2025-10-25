import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '../../utils/theme';
import PinModal from './PinModal';

interface PinSetupProps {
  onSetPin: (pin: string) => Promise<boolean>;
  onChangePin: (currentPin: string, newPin: string) => Promise<boolean>;
  existingPin?: boolean;
  onVerifyCurrentPin: (pin: string) => Promise<boolean>;
}

export default function PinSetup({
  onSetPin,
  onChangePin,
  existingPin = false,
  onVerifyCurrentPin,
}: PinSetupProps) {
  const [mode, setMode] = useState<'setup' | 'change' | 'verify'>(
    existingPin ? 'verify' : 'setup'
  );
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // PIN modal states
  const [showCurrentPinModal, setShowCurrentPinModal] = useState(false);
  const [showNewPinModal, setShowNewPinModal] = useState(false);
  const [showConfirmPinModal, setShowConfirmPinModal] = useState(false);

  const handleSetNewPin = async () => {
    if (newPin.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits long.');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await onSetPin(newPin);
      if (success) {
        Alert.alert(
          'Success',
          'PIN has been set successfully!',
          [{ text: 'OK', onPress: () => setMode('setup') }]
        );
        resetForm();
      } else {
        Alert.alert('Error', 'Failed to set PIN. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (newPin.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits long.');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await onChangePin(currentPin, newPin);
      if (success) {
        Alert.alert(
          'Success',
          'PIN has been changed successfully!',
          [{ text: 'OK', onPress: () => setMode('verify') }]
        );
        resetForm();
      } else {
        Alert.alert('Error', 'Current PIN is incorrect or failed to update.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCurrentPin = async () => {
    if (currentPin.length < 4) {
      Alert.alert('Invalid PIN', 'Please enter your current PIN.');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await onVerifyCurrentPin(currentPin);
      if (isValid) {
        setMode('change');
        setCurrentPin('');
      } else {
        Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  // PIN modal handlers
  const handleCurrentPinVerify = async (pin: string): Promise<boolean> => {
    setCurrentPin(pin);
    setShowCurrentPinModal(false);
    return true;
  };

  const handleNewPinSet = async (pin: string): Promise<boolean> => {
    setNewPin(pin);
    setShowNewPinModal(false);
    return true;
  };

  const handleConfirmPinSet = async (pin: string): Promise<boolean> => {
    setConfirmPin(pin);
    setShowConfirmPinModal(false);
    return true;
  };

  const renderSetupForm = () => (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Set New PIN</Text>
      <Text style={styles.instructions}>
        Choose a 4-6 digit PIN to protect parent features. This PIN will be required to access parent settings and approve chores.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>New PIN</Text>
        <TouchableOpacity
          style={styles.pinInput}
          onPress={() => setShowNewPinModal(true)}
        >
          <Text style={styles.pinInputText}>
            {newPin ? '•'.repeat(newPin.length) : 'Enter PIN'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm PIN</Text>
        <TouchableOpacity
          style={styles.pinInput}
          onPress={() => setShowConfirmPinModal(true)}
        >
          <Text style={styles.pinInputText}>
            {confirmPin ? '•'.repeat(confirmPin.length) : 'Confirm PIN'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          newPin.length >= 4 && confirmPin.length >= 4 && !isLoading
            ? styles.actionButtonActive
            : styles.actionButtonInactive,
        ]}
        onPress={handleSetNewPin}
        disabled={newPin.length < 4 || confirmPin.length < 4 || isLoading}
      >
        <Text style={[
          styles.actionButtonText,
          newPin.length >= 4 && confirmPin.length >= 4 && !isLoading
            ? styles.actionButtonTextActive
            : styles.actionButtonTextInactive,
        ]}>
          {isLoading ? 'Setting PIN...' : 'Set PIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChangeForm = () => (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Change PIN</Text>
      <Text style={styles.instructions}>
        Enter your current PIN and choose a new one.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Current PIN</Text>
        <TouchableOpacity
          style={styles.pinInput}
          onPress={() => setShowCurrentPinModal(true)}
        >
          <Text style={styles.pinInputText}>
            {currentPin ? '•'.repeat(currentPin.length) : 'Enter current PIN'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>New PIN</Text>
        <TouchableOpacity
          style={styles.pinInput}
          onPress={() => setShowNewPinModal(true)}
        >
          <Text style={styles.pinInputText}>
            {newPin ? '•'.repeat(newPin.length) : 'Enter new PIN'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm New PIN</Text>
        <TouchableOpacity
          style={styles.pinInput}
          onPress={() => setShowConfirmPinModal(true)}
        >
          <Text style={styles.pinInputText}>
            {confirmPin ? '•'.repeat(confirmPin.length) : 'Confirm new PIN'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          currentPin.length >= 4 && newPin.length >= 4 && confirmPin.length >= 4 && !isLoading
            ? styles.actionButtonActive
            : styles.actionButtonInactive,
        ]}
        onPress={handleChangePin}
        disabled={currentPin.length < 4 || newPin.length < 4 || confirmPin.length < 4 || isLoading}
      >
        <Text style={[
          styles.actionButtonText,
          currentPin.length >= 4 && newPin.length >= 4 && confirmPin.length >= 4 && !isLoading
            ? styles.actionButtonTextActive
            : styles.actionButtonTextInactive,
        ]}>
          {isLoading ? 'Changing PIN...' : 'Change PIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerifyForm = () => (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Verify Current PIN</Text>
      <Text style={styles.instructions}>
        Enter your current PIN to change it.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Current PIN</Text>
        <TouchableOpacity
          style={styles.pinInput}
          onPress={() => setShowCurrentPinModal(true)}
        >
          <Text style={styles.pinInputText}>
            {currentPin ? '•'.repeat(currentPin.length) : 'Enter current PIN'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          currentPin.length >= 4 && !isLoading
            ? styles.actionButtonActive
            : styles.actionButtonInactive,
        ]}
        onPress={handleVerifyCurrentPin}
        disabled={currentPin.length < 4 || isLoading}
      >
        <Text style={[
          styles.actionButtonText,
          currentPin.length >= 4 && !isLoading
            ? styles.actionButtonTextActive
            : styles.actionButtonTextInactive,
        ]}>
          {isLoading ? 'Verifying...' : 'Verify PIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {mode === 'setup' && renderSetupForm()}
      {mode === 'change' && renderChangeForm()}
      {mode === 'verify' && renderVerifyForm()}
      
      <View style={styles.securityTips}>
        <Text style={styles.tipsTitle}>Security Tips:</Text>
        <Text style={styles.tipText}>• Choose a PIN that's easy for you to remember</Text>
        <Text style={styles.tipText}>• Don't share your PIN with children</Text>
        <Text style={styles.tipText}>• The PIN is required to access parent features</Text>
      </View>

      {/* PIN Modals */}
      <PinModal
        visible={showCurrentPinModal}
        onClose={() => setShowCurrentPinModal(false)}
        onVerify={handleCurrentPinVerify}
        title="Enter Current PIN"
        subtitle="Enter your current PIN to continue"
      />

      <PinModal
        visible={showNewPinModal}
        onClose={() => setShowNewPinModal(false)}
        onVerify={handleNewPinSet}
        title="Enter New PIN"
        subtitle="Choose a 4-6 digit PIN"
      />

      <PinModal
        visible={showConfirmPinModal}
        onClose={() => setShowConfirmPinModal(false)}
        onVerify={handleConfirmPinSet}
        title="Confirm PIN"
        subtitle="Re-enter your PIN to confirm"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  form: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  instructions: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  pinInputText: {
    fontSize: 16,
    color: theme.colors.text,
    letterSpacing: 2,
  },
  actionButton: {
    padding: theme.spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonInactive: {
    backgroundColor: theme.colors.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonTextActive: {
    color: '#fff',
  },
  actionButtonTextInactive: {
    color: theme.colors.textSecondary,
  },
  securityTips: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: theme.spacing.xs,
  },
});
