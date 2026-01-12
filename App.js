/**
 * Ana Uygulama Bileşeni
 * Uygulamanın giriş noktası - Tüm sağlayıcıları ve navigasyonu başlatır
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import UygulamaNavigatoru from './src/navigation/AppNavigator';
import { KimlikDogrulamaProvider } from './src/context/AuthContext';

/**
 * Ana Uygulama Fonksiyonu
 * @returns {JSX.Element} Uygulama bileşeni
 */
export default function Uygulama() {
  return (
    <SafeAreaProvider>
      <KimlikDogrulamaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <UygulamaNavigatoru />
        </NavigationContainer>
      </KimlikDogrulamaProvider>
    </SafeAreaProvider>
  );
}
