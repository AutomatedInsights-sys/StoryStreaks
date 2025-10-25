import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ChildStackParamList } from '../types';
import { theme } from '../utils/theme';
import ProfileSwitcherButton from '../components/shared/ProfileSwitcherButton';

// Import child screens
import ChildHomeScreen from '../screens/child/ChildHomeScreen';
import ChoreDetailScreen from '../screens/child/ChoreDetailScreen';
import StoriesListScreen from '../screens/child/StoriesListScreen';
import StoryReaderScreen from '../screens/child/StoryReaderScreen';
import RewardsScreen from '../screens/child/RewardsScreen';
import MyProgressScreen from '../screens/child/MyProgressScreen';
import AchievementsScreen from '../screens/child/AchievementsScreen';

const Stack = createStackNavigator<ChildStackParamList>();
const Tab = createBottomTabNavigator();

function ChildTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'ChildHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'StoriesList') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Rewards') {
            iconName = focused ? 'gift' : 'gift-outline';
          } else if (route.name === 'MyProgress') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Achievements') {
            iconName = focused ? 'medal' : 'medal-outline';
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
          fontSize: 20,
        },
        headerRight: () => <ProfileSwitcherButton />,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
        },
      })}
    >
      <Tab.Screen 
        name="ChildHome" 
        component={ChildHomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="StoriesList" 
        component={StoriesListScreen}
        options={{ title: 'Stories' }}
      />
      <Tab.Screen 
        name="Rewards" 
        component={RewardsScreen}
        options={{ title: 'Rewards' }}
      />
      <Tab.Screen 
        name="MyProgress" 
        component={MyProgressScreen}
        options={{ title: 'Progress' }}
      />
      <Tab.Screen 
        name="Achievements" 
        component={AchievementsScreen}
        options={{ title: 'Achievements' }}
      />
    </Tab.Navigator>
  );
}

export default function ChildNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerRight: () => <ProfileSwitcherButton />,
      }}
    >
      <Stack.Screen 
        name="ChildHome" 
        component={ChildTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ChoreDetail" 
        component={ChoreDetailScreen}
        options={{ title: 'Chore Details' }}
      />
      <Stack.Screen 
        name="StoryReader" 
        component={StoryReaderScreen}
        options={{ title: 'Story Reader' }}
      />
    </Stack.Navigator>
  );
}
