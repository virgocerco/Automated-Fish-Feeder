// AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from '../screens/AuthScreen';
import Dashboard from '../screens/Dashboard';
import AboutScreen from '../screens/AboutScreen';

type RootStackParamList = {
  AuthScreen: undefined;
  Dashboard: undefined;
  AboutScreen: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // This removes the header for all screens
      }}
    >
      <Stack.Screen name="AuthScreen" component={AuthScreen} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="AboutScreen" component={AboutScreen} />
    </Stack.Navigator>
  );
}
