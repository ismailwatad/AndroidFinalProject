/**
 * İşlem Ekleme/Düzenleme Ekranı Bileşeni
 * Yeni işlem ekleme veya mevcut işlemi düzenleme formu
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { KimlikDogrulamaContext } from '../../context/AuthContext';
import { islemServisi } from '../../services/transactionService';
import { kategoriServisi } from '../../services/categoryService';
import KategoriKarti from '../../components/CategoryCard';
import { colors, spacing, typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { parseISO } from 'date-fns';

const IslemEkleEkrani = ({ route, navigation }) => {
  // Context'ten kullanıcı bilgisini al
  const { kullanici } = useContext(KimlikDogrulamaContext);
  // Düzenlenen işlem bilgisi (varsa)
  const duzenlenenIslem = route?.params?.transaction;

  /**
   * Başlangıç tarihini belirleyen fonksiyon
   * Düzenleme modunda tarihi parse eder
   * @returns {Date} Başlangıç tarihi
   */
  const baslangicTarihiniAl = () => {
    if (duzenlenenIslem?.date) {
      if (duzenlenenIslem.date instanceof Date) {
        return duzenlenenIslem.date;
      } else if (typeof duzenlenenIslem.date === 'string') {
        return parseISO(duzenlenenIslem.date);
      }
    }
    return new Date();
  };

  // Form state'leri
  const [tip, setTip] = useState(duzenlenenIslem?.type || 'expense');
  const [tutar, setTutar] = useState(duzenlenenIslem?.amount?.toString() || '');
  const [tarih, setTarih] = useState(baslangicTarihiniAl());
  const [kategori, setKategori] = useState(duzenlenenIslem?.category || null);
  const [kategoriler, setKategoriler] = useState([]);
  const [tarihSeciciGoster, setTarihSeciciGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  
  // Boş değerlere izin vermek için tarih giriş state'leri
  const [gunGirisi, setGunGirisi] = useState('');
  const [ayGirisi, setAyGirisi] = useState('');
  const [yilGirisi, setYilGirisi] = useState('');

  /**
   * Kategorileri yükleyen fonksiyon
   */
  useEffect(() => {
    kategorileriYukle();
  }, []);

  /**
   * Tarih seçici açıldığında tarih girişlerini başlatır
   */
  useEffect(() => {
    if (tarihSeciciGoster) {
      setGunGirisi(tarih.getDate().toString());
      setAyGirisi((tarih.getMonth() + 1).toString());
      setYilGirisi(tarih.getFullYear().toString());
    }
  }, [tarihSeciciGoster, tarih]);

  /**
   * Kategorileri yükleyen fonksiyon
   */
  const kategorileriYukle = async () => {
    if (!kullanici) return;
    const sonuc = await kategoriServisi.kullanicininKategorileriniGetir(kullanici.id);
    if (sonuc.success) {
      setKategoriler(sonuc.categories);
      if (!kategori && sonuc.categories.length > 0 && tip === 'expense') {
        setKategori(sonuc.categories[0].id);
      }
    }
  };

  /**
   * İşlemi kaydeden fonksiyon
   * Yeni işlem ekler veya mevcut işlemi günceller
   */
  const kaydet = async () => {
    if (!tutar || parseFloat(tutar) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir tutar girin');
      return;
    }

    if (tip === 'expense' && !kategori) {
      Alert.alert('Hata', 'Lütfen bir kategori seçin');
      return;
    }

    setYukleniyor(true);

    const islemVerisi = {
      type: tip,
      amount: parseFloat(tutar),
      date: tarih,
      category: tip === 'expense' ? kategori : null,
    };

    let sonuc;
    if (duzenlenenIslem) {
      sonuc = await islemServisi.islemGuncelle(
        duzenlenenIslem.id,
        islemVerisi
      );
    } else {
      sonuc = await islemServisi.islemEkle(kullanici.id, islemVerisi);
    }

    setYukleniyor(false);

    if (sonuc.success) {
      Alert.alert('Başarılı', duzenlenenIslem ? 'İşlem güncellendi' : 'İşlem eklendi', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Hata', sonuc.error || 'İşlem kaydedilemedi');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* İşlem Tipi Seçimi */}
        <View style={styles.section}>
          <Text style={styles.label}>İşlem Tipi</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                tip === 'income' && styles.typeButtonActive,
                { backgroundColor: tip === 'income' ? colors.success : colors.surface },
              ]}
              onPress={() => {
                setTip('income');
                setKategori(null);
              }}
            >
              <Ionicons
                name="arrow-down-circle"
                size={24}
                color={tip === 'income' ? colors.surface : colors.success}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  { color: tip === 'income' ? colors.surface : colors.success },
                ]}
              >
                Gelir
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                tip === 'expense' && styles.typeButtonActive,
                { backgroundColor: tip === 'expense' ? colors.error : colors.surface },
              ]}
              onPress={() => setTip('expense')}
            >
              <Ionicons
                name="arrow-up-circle"
                size={24}
                color={tip === 'expense' ? colors.surface : colors.error}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  { color: tip === 'expense' ? colors.surface : colors.error },
                ]}
              >
                Gider
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tutar Girişi */}
        <View style={styles.section}>
          <Text style={styles.label}>Tutar (₺)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={tutar}
            onChangeText={setTutar}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Tarih Seçimi */}
        <View style={styles.section}>
          <Text style={styles.label}>Tarih</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setTarihSeciciGoster(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.text} />
            <Text style={styles.dateText}>
              {tarih.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Kategori Seçimi (Sadece Gider için) */}
        {tip === 'expense' && (
          <View style={styles.section}>
            <Text style={styles.label}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoriesContainer}>
                {kategoriler.map((kat) => (
                  <KategoriKarti
                    key={kat.id}
                    kategori={kat}
                    secili={kategori === kat.id}
                    tiklandiginda={() => setKategori(kat.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Kaydet Butonu */}
        <TouchableOpacity
          style={[styles.saveButton, yukleniyor && styles.saveButtonDisabled]}
          onPress={kaydet}
          disabled={yukleniyor}
        >
          {yukleniyor ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>
              {duzenlenenIslem ? 'Güncelle' : 'Kaydet'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={tarihSeciciGoster}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTarihSeciciGoster(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setTarihSeciciGoster(false);
                    }}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Tarih Seç</Text>
                  <TouchableOpacity
                    onPress={() => {
                      // Kapatmadan önce tarihi doğrula ve güncelle
                      const gun = gunGirisi ? parseInt(gunGirisi) : tarih.getDate();
                      const ay = ayGirisi ? parseInt(ayGirisi) : tarih.getMonth() + 1;
                      const yil = yilGirisi ? parseInt(yilGirisi) : tarih.getFullYear();
                      
                      if (!isNaN(gun) && gun >= 1 && gun <= 31 &&
                          !isNaN(ay) && ay >= 1 && ay <= 12 &&
                          !isNaN(yil) && yil >= 1900 && yil <= 2100) {
                        const yeniTarih = new Date(yil, ay - 1, gun);
                        setTarih(yeniTarih);
                      }
                      
                      Keyboard.dismiss();
                      setTarihSeciciGoster(false);
                    }}
                    style={styles.modalButton}
                  >
                    <Text style={[styles.modalButtonText, { color: colors.primary, fontWeight: '600' }]}>
                      Tamam
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContainer}>
                  <View style={styles.dateFieldGroup}>
                    <Text style={styles.dateInputLabel}>Gün</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={gunGirisi}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="Gün"
                      placeholderTextColor={colors.textSecondary}
                      onChangeText={(metin) => {
                        setGunGirisi(metin);
                        if (metin !== '') {
                          const gun = parseInt(metin);
                          if (!isNaN(gun) && gun >= 1 && gun <= 31) {
                            const yeniTarih = new Date(tarih);
                            yeniTarih.setDate(gun);
                            setTarih(yeniTarih);
                          }
                        }
                      }}
                    />
                  </View>
                  <View style={styles.dateFieldGroup}>
                    <Text style={styles.dateInputLabel}>Ay</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={ayGirisi}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="Ay"
                      placeholderTextColor={colors.textSecondary}
                      onChangeText={(metin) => {
                        setAyGirisi(metin);
                        if (metin !== '') {
                          const ay = parseInt(metin);
                          if (!isNaN(ay) && ay >= 1 && ay <= 12) {
                            const yeniTarih = new Date(tarih);
                            yeniTarih.setMonth(ay - 1);
                            setTarih(yeniTarih);
                          }
                        }
                      }}
                    />
                  </View>
                  <View style={styles.dateFieldGroup}>
                    <Text style={styles.dateInputLabel}>Yıl</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={yilGirisi}
                      keyboardType="numeric"
                      maxLength={4}
                      placeholder="Yıl"
                      placeholderTextColor={colors.textSecondary}
                      onChangeText={(metin) => {
                        setYilGirisi(metin);
                        if (metin !== '') {
                          const yil = parseInt(metin);
                          if (!isNaN(yil) && yil >= 1900 && yil <= 2100) {
                            const yeniTarih = new Date(tarih);
                            yeniTarih.setFullYear(yil);
                            setTarih(yeniTarih);
                          }
                        }
                      }}
                    />
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  typeButtonActive: {
    borderWidth: 0,
  },
  typeButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  dateText: {
    ...typography.body,
    color: colors.text,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.surface,
    ...typography.body,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalButton: {
    padding: spacing.sm,
    minWidth: 60,
  },
  modalButtonText: {
    ...typography.body,
    color: colors.text,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateFieldGroup: {
    flex: 1,
    alignItems: 'center',
  },
  dateInputLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dateInput: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default IslemEkleEkrani;
