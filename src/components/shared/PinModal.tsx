import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../utils/theme';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (pin: string) => Promise<boolean>;
  title?: string;
  subtitle?: string;
  maxDigits?: number;
  showForgotPin?: boolean;
  onForgotPin?: () => void;
}

export default function PinModal({
  visible,
  onClose,
  onVerify,
  title = 'Enter PIN',
  subtitle = 'Enter your PIN to continue',
  maxDigits = 6,
  showForgotPin = true,
  onForgotPin,
}: PinModalProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
    }
  }, [visible]);

  const handleDigitPress = (digit: string) => {
    if (pin.length < maxDigits) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleVerify = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await onVerify(pin);
      if (isValid) {
        setPin('');
        onClose();
      } else {
        setError('Incorrect PIN. Please try again.');
        triggerShakeAnimation();
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Forgot PIN?',
      'To reset your PIN, you will need to sign out and sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onForgotPin },
      ]
    );
  };

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < maxDigits; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.pinDot,
            i < pin.length ? styles.pinDotFilled : styles.pinDotEmpty,
          ]}
        />
      );
    }
    return dots;
  };

  const renderKeypad = () => {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];
    
    return (
      <View style={styles.keypad}>
        {digits.map((digit, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.keypadButton,
              digit === '' && styles.keypadButtonEmpty,
            ]}
            onPress={() => {
              if (digit === 'backspace') {
                handleBackspace();
              } else if (digit !== '') {
                handleDigitPress(digit);
              }
            }}
            disabled={digit === '' || isLoading}
          >
            {digit === 'backspace' ? (
              <Text style={styles.backspaceIcon}>⌫</Text>
            ) : digit !== '' ? (
              <Text style={styles.keypadButtonText}>{digit}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <Animated.View 
            style={[
              styles.modal,
              { transform: [{ translateX: shakeAnimation }] }
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.pinContainer}>
              <View style={styles.pinDotsContainer}>
                {renderPinDots()}
              </View>
              
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>

            {renderKeypad()}

            <View style={styles.footer}>
              {showForgotPin && onForgotPin && (
                <TouchableOpacity
                  style={styles.forgotPinButton}
                  onPress={handleForgotPin}
                >
                  <Text style={styles.forgotPinText}>Forgot PIN?</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  pin.length >= 4 && !isLoading ? styles.verifyButtonActive : styles.verifyButtonInactive,
                ]}
                onPress={handleVerify}
                disabled={pin.length < 4 || isLoading}
              >
                <Text style={[
                  styles.verifyButtonText,
                  pin.length >= 4 && !isLoading ? styles.verifyButtonTextActive : styles.verifyButtonTextInactive,
                ]}>
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
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
  pinContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  pinDotEmpty: {
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  keypadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  keypadButtonEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  backspaceIcon: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  forgotPinButton: {
    padding: theme.spacing.sm,
  },
  forgotPinText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyButton: {
    width: '100%',
    padding: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  verifyButtonInactive: {
    backgroundColor: theme.colors.border,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  verifyButtonTextActive: {
    color: '#fff',
  },
  verifyButtonTextInactive: {
    color: theme.colors.textSecondary,
  },
});
