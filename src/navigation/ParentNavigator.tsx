import React, { useEffect } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
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

          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: '#FF8C42',
        tabBarInactiveTintColor: '#64748B',
        headerShown: true,
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowColor: 'transparent',
        },
        headerTransparent: true,
        headerTintColor: '#1A2332',
        headerTitle: '',
        headerLeft: () => (
          <View style={{ marginLeft: 16 }}>
            <Image 
              source={require('../../assets/ChoreyStoriesLogo.jpeg')} 
              style={{ width: 40, height: 40, borderRadius: 8 }}
              resizeMode="cover"
            />
          </View>
        ),
        headerRight: () => <ProfileSwitcherButton />,
        tabBarStyle: {
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 140, 66, 0.1)',
          shadowColor: '#1A2332',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          gap: 2,
        },
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
          backgroundColor: 'transparent',
          elevation: 0,
          shadowColor: 'transparent',
        },
        headerTransparent: true,
        headerTintColor: '#1A2332',
        headerTitle: '',
        headerLeft: () => (
          <View style={{ marginLeft: 16 }}>
            <Image 
              source={require('../../assets/ChoreyStoriesLogo.jpeg')} 
              style={{ width: 40, height: 40, borderRadius: 8 }}
              resizeMode="cover"
            />
          </View>
        ),
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
        options={({ navigation }) => ({
          title: 'Create Chore',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </View>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="EditChore" 
        component={EditChoreScreen}
        options={({ navigation }) => ({
          title: 'Edit Chore',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </View>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="ChoreApproval" 
        component={ChoreApprovalScreen}
        options={({ navigation }) => ({
          title: 'Approve Chores',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </View>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="RewardsManagement" 
        component={RewardsManagementScreen}
        options={({ navigation }) => ({
          title: 'Rewards',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </View>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="RewardRequests" 
        component={RewardRequestsScreen}
        options={({ navigation }) => ({
          title: 'Reward Requests',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </View>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="ChildDetail" 
        component={ChildDetailScreen}
        options={({ navigation }) => ({
          title: 'Child Details',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </View>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="CreateChild" 
        component={CreateChildScreen}
        options={({ navigation }) => ({
          title: 'Add New Child',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 16 }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </View>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
