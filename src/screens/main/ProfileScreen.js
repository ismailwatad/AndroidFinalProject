/**
 * Profil Ekranı Bileşeni
 * Kullanıcı profil bilgilerini düzenleme ve şifre değiştirme ekranı
 */

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { KimlikDogrulamaContext } from '../../context/AuthContext';
import { kimlikDogrulamaServisi } from '../../services/authService';
import { colors, spacing, typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const ProfilEkrani = ({ navigation }) => {
  // Context'ten kullanıcı bilgisi ve güncelleme fonksiyonunu al
  const { kullanici, setKullanici } = useContext(KimlikDogrulamaContext);
  
  // Form state'leri
  const [gorunenIsim, setGorunenIsim] = useState(kullanici?.displayName || '');
  const [eposta] = useState(kullanici?.email || '');
  
  // Şifre değiştirme state'leri
  const [sifreDegistirmeGoster, setSifreDegistirmeGoster] = useState(false);
  const [mevcutSifre, setMevcutSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false);

  /**
   * Profil bilgilerini güncelleyen fonksiyon
   */
  const profiliGuncelle = async () => {
    if (!gorunenIsim.trim()) {
      Alert.alert('Hata', 'Lütfen bir isim girin');
      return;
    }

    setYukleniyor(true);
    const sonuc = await kimlikDogrulamaServisi.profiliGuncelle(kullanici.id, {
      displayName: gorunenIsim.trim(),
    });
    setYukleniyor(false);

    if (sonuc.success) {
      setKullanici(sonuc.user);
      Alert.alert('Başarılı', 'Profil bilgileri güncellendi');
    } else {
      Alert.alert('Hata', sonuc.error || 'Profil güncellenemedi');
    }
  };

  /**
   * Şifreyi değiştiren fonksiyon
   */
  const sifreyiDegistir = async () => {
    if (!mevcutSifre || !yeniSifre || !sifreTekrar) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (yeniSifre !== sifreTekrar) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor');
      return;
    }

    if (yeniSifre.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    setSifreYukleniyor(true);
    const sonuc = await kimlikDogrulamaServisi.sifreDegistir(
      kullanici.id,
      mevcutSifre,
      yeniSifre
    );
    setSifreYukleniyor(false);

    if (sonuc.success) {
      Alert.alert('Başarılı', 'Şifre başarıyla değiştirildi', [
        {
          text: 'Tamam',
          onPress: () => {
            setSifreDegistirmeGoster(false);
            setMevcutSifre('');
            setYeniSifre('');
            setSifreTekrar('');
          },
        },
      ]);
    } else {
      Alert.alert('Hata', sonuc.error || 'Şifre değiştirilemedi');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.konteyner}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.konteyner}
        contentContainerStyle={styles.kaydirmaIcerik}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.icerik}>
        {/* Avatar Bölümü */}
        <View style={styles.avatarBolumu}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={colors.primary} />
          </View>
          <Text style={styles.avatarMetni}>{gorunenIsim || 'Kullanıcı'}</Text>
        </View>

        {/* Profil Bilgileri */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBasligi}>Profil Bilgileri</Text>
          
          <View style={styles.girdiGrubu}>
            <Text style={styles.etiket}>Ad Soyad</Text>
            <TextInput
              style={styles.girdi}
              placeholder="Ad Soyad"
              value={gorunenIsim}
              onChangeText={setGorunenIsim}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.girdiGrubu}>
            <Text style={styles.etiket}>E-posta</Text>
            <TextInput
              style={[styles.girdi, styles.girdiDevreDisi]}
              value={eposta}
              editable={false}
            />
            <Text style={styles.ipucu}>E-posta adresi değiştirilemez</Text>
          </View>

          <TouchableOpacity
            style={[styles.kaydetButonu, yukleniyor && styles.kaydetButonuDevreDisi]}
            onPress={profiliGuncelle}
            disabled={yukleniyor}
          >
            {yukleniyor ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.kaydetButonuMetni}>Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Şifre Değiştirme Bölümü */}
        <View style={styles.bolum}>
          <View style={styles.bolumBaslikAlani}>
            <Text style={styles.bolumBasligi}>Şifre Değiştir</Text>
            <TouchableOpacity
              onPress={() => setSifreDegistirmeGoster(!sifreDegistirmeGoster)}
              style={styles.acKapaButonu}
            >
              <Ionicons
                name={sifreDegistirmeGoster ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {sifreDegistirmeGoster && (
            <View style={styles.sifreBolumu}>
              <View style={styles.girdiGrubu}>
                <Text style={styles.etiket}>Mevcut Şifre</Text>
                <TextInput
                  style={styles.girdi}
                  placeholder="Mevcut şifrenizi girin"
                  value={mevcutSifre}
                  onChangeText={setMevcutSifre}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.girdiGrubu}>
                <Text style={styles.etiket}>Yeni Şifre</Text>
                <TextInput
                  style={styles.girdi}
                  placeholder="Yeni şifrenizi girin"
                  value={yeniSifre}
                  onChangeText={setYeniSifre}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={styles.ipucu}>En az 6 karakter</Text>
              </View>

              <View style={styles.girdiGrubu}>
                <Text style={styles.etiket}>Yeni Şifre Tekrar</Text>
                <TextInput
                  style={styles.girdi}
                  placeholder="Yeni şifrenizi tekrar girin"
                  value={sifreTekrar}
                  onChangeText={setSifreTekrar}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.kaydetButonu,
                  styles.sifreButonu,
                  sifreYukleniyor && styles.kaydetButonuDevreDisi,
                ]}
                onPress={sifreyiDegistir}
                disabled={sifreYukleniyor}
              >
                {sifreYukleniyor ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.kaydetButonuMetni}>Şifreyi Değiştir</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Hesap Bilgileri */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBasligi}>Hesap Bilgileri</Text>
          <View style={styles.bilgiSatiri}>
            <Text style={styles.bilgiEtiketi}>Hesap Oluşturulma Tarihi</Text>
            <Text style={styles.bilgiDegeri}>
              {kullanici?.createdAt
                ? new Date(kullanici.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Bilinmiyor'}
            </Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  konteyner: {
    flex: 1,
    backgroundColor: colors.background,
  },
  kaydirmaIcerik: {
    flexGrow: 1,
  },
  icerik: {
    padding: spacing.lg,
  },
  avatarBolumu: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarMetni: {
    ...typography.h3,
    color: colors.text,
  },
  bolum: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  bolumBaslikAlani: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bolumBasligi: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  acKapaButonu: {
    padding: spacing.xs,
  },
  girdiGrubu: {
    marginBottom: spacing.md,
  },
  etiket: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  girdi: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  girdiDevreDisi: {
    backgroundColor: colors.border + '30',
    color: colors.textSecondary,
  },
  ipucu: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  kaydetButonu: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sifreButonu: {
    backgroundColor: colors.secondary,
  },
  kaydetButonuDevreDisi: {
    opacity: 0.6,
  },
  kaydetButonuMetni: {
    color: colors.surface,
    ...typography.body,
    fontWeight: '600',
  },
  sifreBolumu: {
    marginTop: spacing.md,
  },
  bilgiSatiri: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bilgiEtiketi: {
    ...typography.body,
    color: colors.textLight,
    flex: 1,
  },
  bilgiDegeri: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

export default ProfilEkrani;
