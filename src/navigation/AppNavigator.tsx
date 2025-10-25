import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';

// Import screens
import AuthScreen from '../screens/AuthScreen';
import ProfileSelectionScreen from '../screens/ProfileSelectionScreen';
import ParentNavigator from './ParentNavigator';
import ChildNavigator from './ChildNavigator';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    currentChild, 
    selectedProfile, 
    isPinVerified 
  } = useAuth();

  console.log('🧭 AppNavigator: Navigation state:', {
    isAuthenticated,
    isLoading,
    selectedProfile,
    isPinVerified,
    profileType: selectedProfile === 'parent' ? 'parent' : selectedProfile ? 'child' : 'none'
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !selectedProfile ? (
          <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />
        ) : selectedProfile === 'parent' && isPinVerified ? (
          <Stack.Screen name="ParentStack" component={ParentNavigator} />
        ) : selectedProfile !== 'parent' ? (
          <Stack.Screen 
            name="ChildStack" 
            component={ChildNavigator} 
            initialParams={{ childId: (selectedProfile as any).id }}
          />
        ) : (
          <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
