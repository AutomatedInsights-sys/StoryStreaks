import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
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
        name="ChildHome" 
        component={ChildTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ChoreDetail" 
        component={ChoreDetailScreen}
        options={({ navigation }) => ({
          title: 'Chore Details',
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
        name="StoryReader" 
        component={StoryReaderScreen}
        options={({ navigation }) => ({
          title: '',
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
