import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Constants
import { TAB_COLORS } from './src/constants/colors';

// Types
import { BottomTabParamList, RootStackParamList } from './src/types';

const Tab = createNativeBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        headerShown: false,
        tabBarInactiveTintColor: TAB_COLORS.INACTIVE,
        tabBarActiveTintColor: (() => {
          switch (route.name) {
            case 'Home': return TAB_COLORS.HOME;
            case 'Add': return TAB_COLORS.ADD;
            case 'History': return TAB_COLORS.HISTORY;
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
          tabBarIcon: () => ({ sfSymbol: 'house' }),
        }}
      />
      <Tab.Screen 
        name="Add" 
        component={AddMedicationScreen}
        options={{
          title: 'Add',
          tabBarIcon: () => ({ sfSymbol: 'plus.circle' }),
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: () => ({ sfSymbol: 'clock' }),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: () => ({ sfSymbol: 'gear' }),
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
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;