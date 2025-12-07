import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import { useAuth } from '../../contexts/AuthContext';
import ProfileSwitcher from './ProfileSwitcher';

export default function ProfileSwitcherButton() {
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const { selectedProfile, user } = useAuth();

  const getProfileName = () => {
    if (selectedProfile === 'parent') {
      return user?.name || 'Parent';
    } else if (selectedProfile) {
      return selectedProfile.name;
    }
    return 'Profile';
  };

  const getInitials = () => {
    const name = getProfileName();
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = () => {
    if (selectedProfile === 'parent') {
      return '#FFB347'; // Sunset Gold for parent
    }
    return '#4FACFE'; // Sky Blue for child
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.avatarButton, { backgroundColor: getAvatarColor() }]}
        onPress={() => setShowProfileSwitcher(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.initialsText}>{getInitials()}</Text>
      </TouchableOpacity>

      <ProfileSwitcher
        visible={showProfileSwitcher}
        onClose={() => setShowProfileSwitcher(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Beautiful circular avatar
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  initialsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
