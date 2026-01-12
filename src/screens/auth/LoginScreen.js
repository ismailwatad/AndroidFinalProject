/**
 * Giriş Ekranı Bileşeni
 * Kullanıcı girişi için form ekranı
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
} from 'react-native';
import { KimlikDogrulamaContext } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../constants/theme';
import { validateEmail } from '../../utils/emailValidator';

const GirisEkrani = ({ navigation }) => {
  // Form state'leri
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  
  // Context'ten giriş fonksiyonunu al
  const { girisYap } = useContext(KimlikDogrulamaContext);

  /**
   * Giriş işlemini gerçekleştiren fonksiyon
   */
  const girisIsleminiYap = async () => {
    if (!eposta || !sifre) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    // Email validation
    const emailValidation = validateEmail(eposta);
    if (!emailValidation.isValid) {
      Alert.alert('Hata', emailValidation.error);
      return;
    }

    setYukleniyor(true);
    const sonuc = await girisYap(eposta, sifre);
    setYukleniyor(false);

    if (!sonuc.success) {
      Alert.alert('Giriş Hatası', sonuc.error || 'Giriş yapılamadı');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Kişisel Harcama Takip</Text>
        <Text style={styles.subtitle}>Giriş Yap</Text>

        <View style={styles.form}>
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

          <TouchableOpacity
            style={[styles.button, yukleniyor && styles.buttonDisabled]}
            onPress={girisIsleminiYap}
            disabled={yukleniyor}
          >
            {yukleniyor ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>
              Hesabınız yok mu? Kayıt olun
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.primary,
  },
  subtitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.textLight,
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

export default GirisEkrani;
