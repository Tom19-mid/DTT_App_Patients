import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import { SettingsProvider } from './src/context/SettingsContext';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AlertProvider>
          <SafeAreaProvider>
            <AppNavigator />
          </SafeAreaProvider>
        </AlertProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
