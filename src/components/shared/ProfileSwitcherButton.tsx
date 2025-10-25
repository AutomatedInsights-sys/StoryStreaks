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

  const getProfileIcon = () => {
    if (selectedProfile === 'parent') {
      return 'person';
    } else if (selectedProfile) {
      return 'person-outline';
    }
    return 'person-outline';
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowProfileSwitcher(true)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={getProfileIcon() as keyof typeof Ionicons.glyphMap} 
          size={20} 
          color="#fff" 
          style={{ marginRight: 6 }}
        />
        <Text style={styles.buttonText}>{getProfileName()}</Text>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color="#fff" 
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      <ProfileSwitcher
        visible={showProfileSwitcher}
        onClose={() => setShowProfileSwitcher(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
