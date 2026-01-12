/**
 * Uygulama Navigasyon Yapısı
 * Stack ve Tab navigasyonlarını yönetir
 */

import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { KimlikDogrulamaContext } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Kimlik Doğrulama Ekranları
import GirisEkrani from '../screens/auth/LoginScreen';
import KayitEkrani from '../screens/auth/RegisterScreen';

// Ana Ekranlar
import AnaSayfaEkrani from '../screens/main/DashboardScreen';
import IslemEkleEkrani from '../screens/main/AddTransactionScreen';
import RaporlarEkrani from '../screens/main/ReportsScreen';
import AyarlarEkrani from '../screens/main/SettingsScreen';
import KategoriYonetimiEkrani from '../screens/main/CategoryManagementScreen';
import ProfilEkrani from '../screens/main/ProfileScreen';

const YiginNavigator = createNativeStackNavigator();
const AltSekmeNavigator = createBottomTabNavigator();

/**
 * Ana Alt Sekme Navigator Bileşeni
 * Alt kısımdaki sekme navigasyonunu oluşturur
 */
const AnaAltSekmeler = () => {
  return (
    <AltSekmeNavigator.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let ikonAdi;

          if (route.name === 'Dashboard') {
            ikonAdi = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AddTransaction') {
            ikonAdi = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Reports') {
            ikonAdi = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Settings') {
            ikonAdi = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={ikonAdi} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4ECDC4',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <AltSekmeNavigator.Screen 
        name="Dashboard" 
        component={AnaSayfaEkrani}
        options={{ title: 'Ana Sayfa' }}
      />
      <AltSekmeNavigator.Screen 
        name="AddTransaction" 
        component={IslemEkleEkrani}
        options={{ title: 'İşlem Ekle' }}
      />
      <AltSekmeNavigator.Screen 
        name="Reports" 
        component={RaporlarEkrani}
        options={{ title: 'Raporlar' }}
      />
      <AltSekmeNavigator.Screen 
        name="Settings" 
        component={AyarlarEkrani}
        options={{ title: 'Ayarlar' }}
      />
    </AltSekmeNavigator.Navigator>
  );
};

/**
 * Ana Uygulama Navigator Bileşeni
 * Kullanıcı durumuna göre ekranları yönetir
 */
const UygulamaNavigatoru = () => {
  const { kullanici, yukleniyor } = useContext(KimlikDogrulamaContext);

  // Yükleme durumunda gösterilecek ekran
  if (yukleniyor) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  return (
    <YiginNavigator.Navigator screenOptions={{ headerShown: false }}>
      {kullanici ? (
        // Kullanıcı giriş yapmışsa ana ekranları göster
        <>
          <YiginNavigator.Screen name="MainTabs" component={AnaAltSekmeler} />
          <YiginNavigator.Screen 
            name="AddTransaction" 
            component={IslemEkleEkrani}
            options={{ 
              headerShown: true, 
              title: 'İşlem Ekle',
              presentation: 'card'
            }}
          />
          <YiginNavigator.Screen 
            name="CategoryManagement" 
            component={KategoriYonetimiEkrani}
            options={{ 
              headerShown: true, 
              title: 'Kategori Yönetimi',
              presentation: 'modal'
            }}
          />
          <YiginNavigator.Screen 
            name="Profile" 
            component={ProfilEkrani}
            options={{ 
              headerShown: true, 
              title: 'Profil Ayarları',
              presentation: 'card'
            }}
          />
        </>
      ) : (
        // Kullanıcı giriş yapmamışsa kimlik doğrulama ekranlarını göster
        <>
          <YiginNavigator.Screen name="Login" component={GirisEkrani} />
          <YiginNavigator.Screen name="Register" component={KayitEkrani} />
        </>
      )}
    </YiginNavigator.Navigator>
  );
};

export default UygulamaNavigatoru;
