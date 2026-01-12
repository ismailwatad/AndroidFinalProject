/**
 * Kayıt Ekranı Bileşeni
 * Yeni kullanıcı kaydı için form ekranı
 */

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { KimlikDogrulamaContext } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../constants/theme';
import { validateEmail } from '../../utils/emailValidator';

const KayitEkrani = ({ navigation }) => {
  // Form state'leri
  const [gorunenIsim, setGorunenIsim] = useState('');
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  
  // Context'ten kayıt fonksiyonunu al
  const { kayitOl } = useContext(KimlikDogrulamaContext);

  /**
   * Kayıt işlemini gerçekleştiren fonksiyon
   */
  const kayitIsleminiYap = async () => {
    if (!gorunenIsim || !eposta || !sifre || !sifreTekrar) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    // Email validation
    const emailValidation = validateEmail(eposta);
    if (!emailValidation.isValid) {
      Alert.alert('Hata', emailValidation.error);
      return;
    }

    if (sifre !== sifreTekrar) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (sifre.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    setYukleniyor(true);
    const sonuc = await kayitOl(eposta, sifre, gorunenIsim);
    setYukleniyor(false);

    if (!sonuc.success) {
      Alert.alert('Kayıt Hatası', sonuc.error || 'Kayıt yapılamadı');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Yeni Hesap Oluştur</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              placeholderTextColor={colors.textSecondary}
              value={gorunenIsim}
              onChangeText={setGorunenIsim}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor={colors.textSecondary}
              value={eposta}
              onChangeText={setEposta}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor={colors.textSecondary}
              value={sifre}
              onChangeText={setSifre}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Şifre Tekrar"
              placeholderTextColor={colors.textSecondary}
              value={sifreTekrar}
              onChangeText={setSifreTekrar}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, yukleniyor && styles.buttonDisabled]}
              onPress={kayitIsleminiYap}
              disabled={yukleniyor}
            >
              {yukleniyor ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>
                Zaten hesabınız var mı? Giriş yapın
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.primary,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
  },
});

export default KayitEkrani;
