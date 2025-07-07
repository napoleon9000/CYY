import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { RouteProp } from '@react-navigation/native';

// Initialize notification system
import './src/utils/notifications';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import TrackScreen from './src/screens/TrackScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MedicationDetailsScreen from './src/screens/MedicationDetailsScreen';

// Constants
import { TAB_COLORS } from './src/constants/colors';

// Types
import { BottomTabParamList, RootStackParamList, TAB_ICONS } from './src/types';

const Tab = createNativeBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<BottomTabParamList> }) => ({
        headerShown: false,
        tabBarInactiveTintColor: TAB_COLORS.INACTIVE,
        tabBarActiveTintColor: (() => {
          switch (route.name) {
            case 'Home': return TAB_COLORS.HOME;
            case 'Add': return TAB_COLORS.ADD;
            case 'Track': return TAB_COLORS.TRACK;
            case 'Settings': return TAB_COLORS.SETTINGS;
            default: return TAB_COLORS.ACTIVE;
          }
        })(),
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: () => ({ sfSymbol: TAB_ICONS.HOME }),
        }}
      />
      <Tab.Screen 
        name="Add" 
        component={AddMedicationScreen}
        options={{
          title: 'Add',
          tabBarIcon: () => ({ sfSymbol: TAB_ICONS.ADD }),
        }}
      />
      <Tab.Screen 
        name="Track" 
        component={TrackScreen}
        options={{
          title: 'Track',
          tabBarIcon: () => ({ sfSymbol: TAB_ICONS.TRACK }),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: () => ({ sfSymbol: TAB_ICONS.SETTINGS }),
        }}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={TAB_COLORS.ADD} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen 
            name="AddMedication" 
            component={AddMedicationScreen}
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="MedicationDetails" 
            component={MedicationDetailsScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;