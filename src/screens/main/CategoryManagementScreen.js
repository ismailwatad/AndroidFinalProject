/**
 * Kategori Yönetimi Ekranı Bileşeni
 * Kategori ekleme, düzenleme ve silme işlemlerini yönetir
 */

// Ekran: Kategori yönetimi (varsayılan + kullanıcı kategorileri, ekleme/düzenleme/silme)
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { KimlikDogrulamaContext } from '../../context/AuthContext';
import { kategoriServisi, VARSAYILAN_KATEGORILER } from '../../services/categoryService';
import KategoriKarti from '../../components/CategoryCard';
import { colors, spacing, typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const KategoriYonetimiEkrani = ({ navigation }) => {
  // Kullanıcı bilgisini context'ten al
  const { kullanici } = useContext(KimlikDogrulamaContext);
  
  // Durumlar: varsayılan + kullanıcı kategorileri, modal, form, yükleme
  const [kategoriler, setKategoriler] = useState([]);
  const [kullaniciKategorileri, setKullaniciKategorileri] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [modalGorunur, setModalGorunur] = useState(false);
  const [duzenlenenKategori, setDuzenlenenKategori] = useState(null);
  const [formVerisi, setFormVerisi] = useState({
    name: '',
    icon: '📦',
    color: colors.primary,
  });

  /**
   * Kategorileri yükleyen fonksiyon
   */
  // Kategorileri yükler: varsayılan + override + özel
  const kategorileriYukle = React.useCallback(async () => {
    if (!kullanici) {
      setYukleniyor(false);
      setKategoriler([]);
      setKullaniciKategorileri([]);
      return;
    }

    setYukleniyor(true);
    try {
      const sonuc = await kategoriServisi.kullanicininKategorileriniGetir(kullanici.id);
      
      if (sonuc.success && sonuc.categories && Array.isArray(sonuc.categories)) {
        // Filter default categories (those with IDs matching VARSAYILAN_KATEGORILER)
        const varsayilanKategoriler = sonuc.categories.filter((kat) =>
          kat && kat.id && VARSAYILAN_KATEGORILER.some((vk) => vk.id === kat.id)
        );
        // Filter custom categories (those not in VARSAYILAN_KATEGORILER and not overrides)
        const ozelKategoriler = sonuc.categories.filter(
          (kat) => kat && kat.id && !VARSAYILAN_KATEGORILER.some((vk) => vk.id === kat.id) && kat.isOverride !== true
        );
        
        // Always set default categories (use VARSAYILAN_KATEGORILER if filtered list is empty)
        if (varsayilanKategoriler.length === 0) {
          setKategoriler(VARSAYILAN_KATEGORILER);
        } else {
          setKategoriler(varsayilanKategoriler);
        }
        setKullaniciKategorileri(ozelKategoriler || []);
      } else {
        // Fallback to default categories if no categories found
        setKategoriler(VARSAYILAN_KATEGORILER);
        setKullaniciKategorileri([]);
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      // Fallback to default categories on error
      setKategoriler(VARSAYILAN_KATEGORILER);
      setKullaniciKategorileri([]);
    } finally {
      setYukleniyor(false);
    }
  }, [kullanici]);

  /**
   * Kategorileri yükleyen fonksiyon - kullanıcı değiştiğinde
   */
  // Kullanıcı değiştiğinde kategorileri tazele
  useEffect(() => {
    if (kullanici) {
      kategorileriYukle();
    } else {
      setYukleniyor(false);
    }
  }, [kullanici, kategorileriYukle]);

  // Ekran odaklandığında kategorileri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      if (kullanici) {
        kategorileriYukle();
      } else {
        setYukleniyor(false);
      }
    }, [kullanici, kategorileriYukle])
  );

  /**
   * Ekleme modalını açan fonksiyon
   */
  // Yeni kategori için modal aç
  const eklemeModaliniAc = () => {
    setDuzenlenenKategori(null);
    setFormVerisi({ name: '', icon: '📦', color: colors.primary });
    setModalGorunur(true);
  };

  /**
   * Düzenleme modalını açan fonksiyon
   * @param {Object} kategori - Düzenlenecek kategori
   */
  // Mevcut kategoriyi düzenlemek için modal aç
  const duzenlemeModaliniAc = (kategori) => {
    setDuzenlenenKategori(kategori);
    setFormVerisi({
      name: kategori.name,
      icon: kategori.icon,
      color: kategori.color,
    });
    setModalGorunur(true);
  };

  /**
   * Kategoriyi kaydeden fonksiyon
   * Yeni kategori ekler veya mevcut kategoriyi günceller
   */
  // Kategori ekle/güncelle işlemi
  const kaydet = async () => {
    if (!kullanici) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    if (!formVerisi.name.trim()) {
      Alert.alert('Hata', 'Lütfen kategori adı girin');
      return;
    }

    if (duzenlenenKategori) {
      // Güncelle - pass user ID for default category overrides
      const sonuc = await kategoriServisi.kategoriGuncelle(duzenlenenKategori.id, formVerisi, kullanici.id);
      if (sonuc.success) {
        Alert.alert('Başarılı', 'Kategori güncellendi');
        setModalGorunur(false);
        kategorileriYukle();
      } else {
        Alert.alert('Hata', sonuc.error || 'Kategori güncellenemedi');
      }
    } else {
      // Yeni ekle
      const sonuc = await kategoriServisi.kategoriEkle(kullanici.id, formVerisi);
      if (sonuc.success) {
        Alert.alert('Başarılı', 'Kategori eklendi');
        setModalGorunur(false);
        kategorileriYukle();
      } else {
        Alert.alert('Hata', sonuc.error || 'Kategori eklenemedi');
      }
    }
  };

  // Kategoriyi sil (varsayılanlar hariç, onay diyaloğu ile)
  const sil = (kategori) => {
    // Varsayılan kategoriler silinemez
    if (VARSAYILAN_KATEGORILER.some((vk) => vk.id === kategori.id)) {
      Alert.alert('Bilgi', 'Varsayılan kategoriler silinemez');
      return;
    }

    Alert.alert(
      'Kategoriyi Sil',
      `${kategori.name} kategorisini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const sonuc = await kategoriServisi.kategoriSil(kategori.id);
            if (sonuc.success) {
              Alert.alert('Başarılı', 'Kategori silindi');
              kategorileriYukle();
            } else {
              Alert.alert('Hata', sonuc.error);
            }
          },
        },
      ]
    );
  };

  // Renk seçenekleri
  const renkSecenekleri = [
    '#FF6B6B',
    '#4ECDC4',
    '#95E1D3',
    '#F38181',
    '#AA96DA',
    '#FCBAD3',
    '#A8E6CF',
    '#FFD93D',
    '#6BCB77',
    '#4D96FF',
  ];

  // İkon seçenekleri
  const ikonSecenekleri = ['📦', '🍔', '🚗', '🎬', '💡', '🛍️', '🏥', '📚', '✈️', '🏠', '🎮', '💻'];

  // Yükleme durumunda iskelet ekranı göster
  if (yukleniyor) {
    return (
      <View style={styles.yuklemeKonteyner}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Kullanıcı yoksa bilgi mesajı göster
  if (!kullanici) {
    return (
      <View style={styles.yuklemeKonteyner}>
        <Text style={styles.hataMetni}>Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.</Text>
      </View>
    );
  }

  // Debug: Log current state
  console.log('Kategori Yönetimi Ekranı - Durum:', {
    kategorilerSayisi: kategoriler.length,
    kullaniciKategorileriSayisi: kullaniciKategorileri.length,
    yukleniyor,
    kullanici: kullanici ? kullanici.id : null
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Varsayılan Kategoriler */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBasligi}>Varsayılan Kategoriler</Text>
          {kategoriler.length === 0 ? (
            <Text style={styles.bosMetin}>Kategori yükleniyor...</Text>
          ) : (
            <View style={styles.kategorilerIzgara}>
              {kategoriler.map((kategori) => {
                if (!kategori || !kategori.id || !kategori.name) {
                  console.warn('Geçersiz kategori:', kategori);
                  return null;
                }
                const guvenliKategori = {
                  ...kategori,
                  color: kategori.color || colors.primary,
                  icon: kategori.icon || '📦',
                };
                return (
                  <View key={kategori.id} style={styles.kategoriSarayici}>
                    <KategoriKarti 
                      kategori={guvenliKategori}
                      secili={false}
                    />
                    <View style={styles.kategoriIslemleri}>
                      <TouchableOpacity
                        onPress={() => duzenlemeModaliniAc(kategori)}
                        style={styles.islemButonu}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Kullanıcı Kategorileri */}
        <View style={styles.bolum}>
          <View style={styles.bolumBaslikAlani}>
            <Text style={styles.bolumBasligi}>Özel Kategoriler</Text>
            <TouchableOpacity onPress={eklemeModaliniAc} style={styles.ekleButonu}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {kullaniciKategorileri.length === 0 ? (
            <Text style={styles.bosMetin}>Henüz özel kategori eklenmemiş</Text>
          ) : (
            <View style={styles.kategorilerIzgara}>
              {kullaniciKategorileri.map((kategori) => {
                if (!kategori || !kategori.id || !kategori.name) {
                  console.warn('Geçersiz kategori:', kategori);
                  return null;
                }
                const guvenliKategori = {
                  ...kategori,
                  color: kategori.color || colors.primary,
                  icon: kategori.icon || '📦',
                };
                return (
                  <View key={kategori.id} style={styles.kategoriSarayici}>
                    <KategoriKarti 
                      kategori={guvenliKategori}
                      secili={false}
                    />
                    <View style={styles.kategoriIslemleri}>
                      <TouchableOpacity
                        onPress={() => duzenlemeModaliniAc(kategori)}
                        style={styles.islemButonu}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => sil(kategori)}
                        style={styles.islemButonu}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Kategori Ekleme/Düzenleme Modal */}
      <Modal
        visible={modalGorunur}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalGorunur(false)}
      >
        <View style={styles.modalKonteyner}>
          <View style={styles.modalIcerik}>
            <View style={styles.modalBaslik}>
              <Text style={styles.modalBaslikMetni}>
                {duzenlenenKategori ? 'Kategori Düzenle' : 'Yeni Kategori'}
              </Text>
              <TouchableOpacity onPress={() => setModalGorunur(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.girdi}
              placeholder="Kategori Adı"
              value={formVerisi.name}
              onChangeText={(metin) => setFormVerisi({ ...formVerisi, name: metin })}
            />

            <Text style={styles.etiket}>İkon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.ikonKonteyner}>
                {ikonSecenekleri.map((ikon) => (
                  <TouchableOpacity
                    key={ikon}
                    style={[
                      styles.ikonSecenegi,
                      formVerisi.icon === ikon && styles.ikonSecenegiSecili,
                    ]}
                    onPress={() => setFormVerisi({ ...formVerisi, icon: ikon })}
                  >
                    <Text style={styles.ikonMetni}>{ikon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.etiket}>Renk</Text>
            <View style={styles.renkKonteyner}>
              {renkSecenekleri.map((renk) => (
                <TouchableOpacity
                  key={renk}
                  style={[
                    styles.renkSecenegi,
                    { backgroundColor: renk },
                    formVerisi.color === renk && styles.renkSecenegiSecili,
                  ]}
                  onPress={() => setFormVerisi({ ...formVerisi, color: renk })}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.kaydetButonu} onPress={kaydet}>
              <Text style={styles.kaydetButonuMetni}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Alias to avoid missing style usage
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Original naming kept for compatibility
  konteyner: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  yuklemeKonteyner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  hataMetni: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  bolum: {
    padding: spacing.lg,
  },
  bolumBaslikAlani: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bolumBasligi: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  kategorilerIzgara: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  kategoriSarayici: {
    position: 'relative',
  },
  kategoriIslemleri: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.xs,
  },
  islemButonu: {
    padding: spacing.xs,
  },
  ekleButonu: {
    padding: spacing.xs,
  },
  bosMetin: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  modalKonteyner: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalIcerik: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalBaslik: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalBaslikMetni: {
    ...typography.h3,
    color: colors.text,
  },
  girdi: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  etiket: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  ikonKonteyner: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  ikonSecenegi: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ikonSecenegiSecili: {
    borderColor: colors.primary,
  },
  ikonMetni: {
    fontSize: 24,
  },
  renkKonteyner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  renkSecenegi: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  renkSecenegiSecili: {
    borderColor: colors.text,
  },
  kaydetButonu: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  kaydetButonuMetni: {
    color: colors.surface,
    ...typography.body,
    fontWeight: '600',
  },
});

export default KategoriYonetimiEkrani;
