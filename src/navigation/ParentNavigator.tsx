import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { ParentStackParamList } from '../types';
import { theme } from '../utils/theme';
import ProfileSwitcherButton from '../components/shared/ProfileSwitcherButton';

// Import parent screens
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import ChoreManagementScreen from '../screens/parent/ChoreManagementScreen';
import ChildProfilesScreen from '../screens/parent/ChildProfilesScreen';
import SettingsScreen from '../screens/parent/SettingsScreen';
import CreateChoreScreen from '../screens/parent/CreateChoreScreen';
import EditChoreScreen from '../screens/parent/EditChoreScreen';
import ChoreApprovalScreen from '../screens/parent/ChoreApprovalScreen';
import RewardsManagementScreen from '../screens/parent/RewardsManagementScreen';
import RewardRequestsScreen from '../screens/parent/RewardRequestsScreen';
import ChildDetailScreen from '../screens/parent/ChildDetailScreen';
import CreateChildScreen from '../screens/parent/CreateChildScreen';
import AnalyticsScreen from '../screens/parent/AnalyticsScreen';

const Stack = createStackNavigator<ParentStackParamList>();
const Tab = createBottomTabNavigator();

function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'ParentHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ChoreManagement') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'ChildProfiles') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <ProfileSwitcherButton />,
      })}
    >
      <Tab.Screen 
        name="ParentHome" 
        component={ParentHomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="ChoreManagement" 
        component={ChoreManagementScreen}
        options={{ title: 'Chores' }}
      />
      <Tab.Screen 
        name="ChildProfiles" 
        component={ChildProfilesScreen}
        options={{ title: 'Children' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
    </Tab.Navigator>
  );
}

export default function ParentNavigator() {
  const { checkPinTimeout, clearPinVerification } = useAuth();
  const navigation = useNavigation();

  // Check PIN timeout when navigating to sensitive screens
  useFocusEffect(
    React.useCallback(() => {
      const checkPin = () => {
        console.log('🧭 ParentNavigator: Checking PIN timeout on focus...');
        const isPinValid = checkPinTimeout();
        console.log('🧭 ParentNavigator: PIN timeout check result:', isPinValid);
        
        if (!isPinValid) {
          console.log('🧭 ParentNavigator: PIN expired, navigating back to profile selection');
          // PIN has expired, clear verification and navigate back to profile selection
          clearPinVerification();
          navigation.reset({
            index: 0,
            routes: [{ name: 'ProfileSelection' as never }],
          });
        } else {
          console.log('🧭 ParentNavigator: PIN is valid, staying in parent interface');
        }
      };

      checkPin();
    }, [checkPinTimeout, clearPinVerification, navigation])
  );

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <ProfileSwitcherButton />,
      }}
    >
      <Stack.Screen 
        name="ParentHome" 
        component={ParentTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateChore" 
        component={CreateChoreScreen}
        options={{ title: 'Create Chore' }}
      />
      <Stack.Screen 
        name="EditChore" 
        component={EditChoreScreen}
        options={{ title: 'Edit Chore' }}
      />
      <Stack.Screen 
        name="ChoreApproval" 
        component={ChoreApprovalScreen}
        options={{ title: 'Approve Chores' }}
      />
      <Stack.Screen 
        name="RewardsManagement" 
        component={RewardsManagementScreen}
        options={{ title: 'Rewards' }}
      />
      <Stack.Screen 
        name="RewardRequests" 
        component={RewardRequestsScreen}
        options={{ title: 'Reward Requests' }}
      />
      <Stack.Screen 
        name="ChildDetail" 
        component={ChildDetailScreen}
        options={{ title: 'Child Details' }}
      />
      <Stack.Screen 
        name="CreateChild" 
        component={CreateChildScreen}
        options={{ title: 'Add New Child' }}
      />
    </Stack.Navigator>
  );
}
