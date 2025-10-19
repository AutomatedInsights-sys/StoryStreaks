import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';

// Import screens
import AuthScreen from '../screens/AuthScreen';
import ParentNavigator from './ParentNavigator';
import ChildNavigator from './ChildNavigator';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user, currentChild } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : user?.role === 'parent' ? (
          <Stack.Screen name="ParentStack" component={ParentNavigator} />
        ) : currentChild ? (
          <Stack.Screen 
            name="ChildStack" 
            component={ChildNavigator} 
            initialParams={{ childId: currentChild.id }}
          />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
