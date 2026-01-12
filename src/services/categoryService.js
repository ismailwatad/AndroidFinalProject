// Kategori servisi: tüm kategori CRUD ve yardımcı işlemleri yönetir

import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage anahtarı
const KATEGORILER_ANAHTARI = '@categories';

// Varsayılan kategoriler
export const VARSAYILAN_KATEGORILER = [
  { id: 'food', name: 'Gıda', icon: '🍔', color: '#FF6B6B' },
  { id: 'transport', name: 'Ulaşım', icon: '🚗', color: '#4ECDC4' },
  { id: 'entertainment', name: 'Eğlence', icon: '🎬', color: '#95E1D3' },
  { id: 'bills', name: 'Faturalar', icon: '💡', color: '#F38181' },
  { id: 'shopping', name: 'Alışveriş', icon: '🛍️', color: '#AA96DA' },
  { id: 'health', name: 'Sağlık', icon: '🏥', color: '#FCBAD3' },
  { id: 'education', name: 'Eğitim', icon: '📚', color: '#A8E6CF' },
  { id: 'other', name: 'Diğer', icon: '📦', color: '#D3D3D3' },
];

// Tüm kategorileri AsyncStorage'dan okur
const tumKategorileriGetir = async () => {
  try {
    const veri = await AsyncStorage.getItem(KATEGORILER_ANAHTARI);
    return veri ? JSON.parse(veri) : [];
  } catch (hata) {
    console.error('Kategoriler alınırken hata:', hata);
    return [];
  }
};

// Tüm kategorileri AsyncStorage'a yazar
const tumKategorileriKaydet = async (kategoriler) => {
  try {
    await AsyncStorage.setItem(KATEGORILER_ANAHTARI, JSON.stringify(kategoriler));
    return true;
  } catch (hata) {
    console.error('Kategoriler kaydedilirken hata:', hata);
    return false;
  }
};

// Servis objesi: yüksek seviye kategori işlemleri
export const kategoriServisi = {
  // Kullanıcının kategorilerini (varsayılan + override + özel) getirir
  kullanicininKategorileriniGetir: async (kullaniciId) => {
    try {
      const ozelKategoriler = await tumKategorileriGetir();
      const kullaniciKategorileri = ozelKategoriler.filter(k => k.userId === kullaniciId);
      
      // Get user-specific overrides for default categories
      const kullaniciOverrideLeri = kullaniciKategorileri.filter(k => k.isOverride === true);
      
      // Merge default categories with overrides
      const varsayilanKategorilerGuncellenmis = VARSAYILAN_KATEGORILER.map(varsayilanKat => {
        const override = kullaniciOverrideLeri.find(
          o => o.originalId === varsayilanKat.id
        );
        if (override) {
          // Use override instead of default
          return {
            ...varsayilanKat,
            ...override,
            id: varsayilanKat.id, // Keep original ID for consistency
          };
        }
        return varsayilanKat;
      });
      
      // User's custom categories (not overrides)
      const ozelKategorilerListesi = kullaniciKategorileri.filter(k => k.isOverride !== true);
      
      // Combine: default (with overrides) + custom categories
      const tumKategoriler = [...varsayilanKategorilerGuncellenmis, ...ozelKategorilerListesi];
      
      return { success: true, categories: tumKategoriler };
    } catch (hata) {
      // Hata durumunda varsayılan kategorileri döndür
      return { success: true, categories: VARSAYILAN_KATEGORILER };
    }
  },

  // Yeni kullanıcı kategorisi ekler
  kategoriEkle: async (kullaniciId, kategoriVerisi) => {
    try {
      const kategoriler = await tumKategorileriGetir();
      const yeniKategori = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...kategoriVerisi,
        userId: kullaniciId,
        createdAt: new Date().toISOString(),
      };
      
      kategoriler.push(yeniKategori);
      const kaydedildi = await tumKategorileriKaydet(kategoriler);
      
      if (kaydedildi) {
        return { success: true, id: yeniKategori.id };
      } else {
        return { success: false, error: 'Kategori kaydedilemedi' };
      }
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  },

  // Kategori güncelleme (varsayılan için override, özel için doğrudan)
  kategoriGuncelle: async (kategoriId, kategoriVerisi, kullaniciId = null) => {
    try {
      // Check if it's a default category
      const varsayilanKategori = VARSAYILAN_KATEGORILER.find(k => k.id === kategoriId);
      
      if (varsayilanKategori) {
        // For default categories, create a user-specific override
        if (!kullaniciId) {
          return { success: false, error: 'Varsayılan kategoriler için kullanıcı ID gerekli' };
        }
        
        // Check if user already has an override for this category
        const kategoriler = await tumKategorileriGetir();
        const mevcutOverride = kategoriler.find(
          k => k.originalId === kategoriId && k.userId === kullaniciId && k.isOverride === true
        );
        
        if (mevcutOverride) {
          // Update existing override
          const indeks = kategoriler.findIndex(k => k.id === mevcutOverride.id);
          kategoriler[indeks] = {
            ...kategoriler[indeks],
            ...kategoriVerisi,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Create new override
          const yeniOverride = {
            id: kategoriId + '_override_' + kullaniciId,
            originalId: kategoriId,
            ...kategoriVerisi,
            userId: kullaniciId,
            isOverride: true,
            createdAt: new Date().toISOString(),
          };
          kategoriler.push(yeniOverride);
        }
        
        const kaydedildi = await tumKategorileriKaydet(kategoriler);
        return kaydedildi ? { success: true } : { success: false, error: 'Kategori güncellenemedi' };
      } else {
        // Regular user category update
        const kategoriler = await tumKategorileriGetir();
        const indeks = kategoriler.findIndex(k => k.id === kategoriId);
        
        if (indeks === -1) {
          return { success: false, error: 'Kategori bulunamadı' };
        }
        
        // Check if user owns this category
        if (kullaniciId && kategoriler[indeks].userId !== kullaniciId) {
          return { success: false, error: 'Bu kategoriyi düzenleme yetkiniz yok' };
        }
        
        kategoriler[indeks] = {
          ...kategoriler[indeks],
          ...kategoriVerisi,
          updatedAt: new Date().toISOString(),
        };
        
        const kaydedildi = await tumKategorileriKaydet(kategoriler);
        return kaydedildi ? { success: true } : { success: false, error: 'Kategori güncellenemedi' };
      }
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  },

  // Kullanıcı kategorisini siler (varsayılanlar hariç)
  kategoriSil: async (kategoriId) => {
    try {
      const kategoriler = await tumKategorileriGetir();
      const filtrelenmisKategoriler = kategoriler.filter(k => k.id !== kategoriId);
      const kaydedildi = await tumKategorileriKaydet(filtrelenmisKategoriler);
      return kaydedildi ? { success: true } : { success: false, error: 'Kategori silinemedi' };
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  },

  // ID'ye göre kategori bulur, yoksa varsayılan "Diğer" döner
  kategoriIdyeGoreGetir: (kategoriId, kategoriler) => {
    return kategoriler.find(k => k.id === kategoriId) || VARSAYILAN_KATEGORILER.find(k => k.id === 'other');
  }
};
