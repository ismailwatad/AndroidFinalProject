/**
 * Ayarlar Ekranı Bileşeni
 * Uygulama ayarları ve kullanıcı bilgilerini gösterir
 */

import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { KimlikDogrulamaContext } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const AyarlarEkrani = ({ navigation }) => {
  // Context'ten kullanıcı bilgisi ve çıkış fonksiyonunu al
  const { kullanici, cikisYap } = useContext(KimlikDogrulamaContext);

  /**
   * Çıkış işlemini gerçekleştiren fonksiyon
   */
  const cikisIsleminiYap = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await cikisYap();
          },
        },
      ]
    );
  };

  /**
   * Navigate to Category Management screen
   */
  const kategoriYonetimineGit = () => {
    try {
      // Navigate to CategoryManagement screen in the root stack navigator
      // Since Settings is inside Tab Navigator, we need to navigate to the root stack
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('CategoryManagement');
      } else {
        // Fallback: use CommonActions to navigate
        navigation.dispatch(
          CommonActions.navigate({
            name: 'CategoryManagement',
          })
        );
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Hata', 'Kategori yönetimi ekranına gidilemedi. Lütfen tekrar deneyin.');
    }
  };

  // Ayarlar menü öğeleri
  const ayarlarOgelari = [
    {
      id: 'categories',
      title: 'Kategori Yönetimi',
      icon: 'folder-outline',
      onPress: kategoriYonetimineGit,
    },
    {
      id: 'profile',
      title: 'Profil Bilgileri',
      icon: 'person-outline',
      onPress: () => {
        try {
          const parent = navigation.getParent();
          if (parent) {
            parent.navigate('Profile');
          } else {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Profile',
              })
            );
          }
        } catch (error) {
          console.error('Navigation error:', error);
          Alert.alert('Hata', 'Profil ekranına gidilemedi. Lütfen tekrar deneyin.');
        }
      },
    },
    {
      id: 'about',
      title: 'Hakkında',
      icon: 'information-circle-outline',
      onPress: () =>
        Alert.alert(
          'Kişisel Harcama Takip',
          'Versiyon: 1.0.0\n\nGelir ve giderlerinizi kolayca takip edin.'
        ),
    },
    {
      id: 'logout',
      title: 'Çıkış Yap',
      icon: 'log-out-outline',
      onPress: cikisIsleminiYap,
      color: colors.error,
    },
  ];

  return (
    <ScrollView style={styles.konteyner}>
      {/* Kullanıcı Bilgisi */}
      <View style={styles.kullaniciBolumu}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={colors.primary} />
        </View>
        <Text style={styles.kullaniciIsmi}>{kullanici?.displayName || 'Kullanıcı'}</Text>
        <Text style={styles.kullaniciEpostasi}>{kullanici?.email}</Text>
      </View>

      {/* Ayarlar Listesi */}
      <View style={styles.ayarlarListesi}>
        {ayarlarOgelari.map((oge) => (
          <TouchableOpacity
            key={oge.id}
            style={styles.ayarOgesi}
            onPress={oge.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.ayarSol}>
              <Ionicons
                name={oge.icon}
                size={24}
                color={oge.color || colors.text}
              />
              <Text
                style={[styles.ayarMetni, oge.color && { color: oge.color }]}
              >
                {oge.title}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  konteyner: {
    flex: 1,
    backgroundColor: colors.background,
  },
  kullaniciBolumu: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  kullaniciIsmi: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  kullaniciEpostasi: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  ayarlarListesi: {
    backgroundColor: colors.surface,
  },
  ayarOgesi: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ayarSol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ayarMetni: {
    ...typography.body,
    marginLeft: spacing.md,
    color: colors.text,
  },
});

export default AyarlarEkrani;
