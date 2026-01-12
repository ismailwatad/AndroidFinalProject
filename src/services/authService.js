/**
 * Kimlik Doğrulama Servisi
 * Kullanıcı kaydı, girişi, çıkışı ve profil yönetimi işlemlerini yönetir
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage anahtarları
const KULLANICILAR_ANAHTARI = '@users';
const MEVCUT_KULLANICI_ANAHTARI = '@currentUser';

/**
 * Tüm kullanıcıları AsyncStorage'dan getiren yardımcı fonksiyon
 * @returns {Promise<Array>} Kullanıcı listesi
 */
const tumKullanicilariGetir = async () => {
  try {
    const veri = await AsyncStorage.getItem(KULLANICILAR_ANAHTARI);
    return veri ? JSON.parse(veri) : [];
  } catch (hata) {
    console.error('Kullanıcılar alınırken hata:', hata);
    return [];
  }
};

/**
 * Tüm kullanıcıları AsyncStorage'a kaydeden yardımcı fonksiyon
 * @param {Array} kullanicilar - Kaydedilecek kullanıcı listesi
 * @returns {Promise<boolean>} İşlem başarılı mı?
 */
const tumKullanicilariKaydet = async (kullanicilar) => {
  try {
    await AsyncStorage.setItem(KULLANICILAR_ANAHTARI, JSON.stringify(kullanicilar));
    return true;
  } catch (hata) {
    console.error('Kullanıcılar kaydedilirken hata:', hata);
    return false;
  }
};

/**
 * Mevcut kullanıcıyı AsyncStorage'dan getiren yardımcı fonksiyon
 * @returns {Promise<Object|null>} Mevcut kullanıcı bilgisi
 */
const mevcutKullaniciiGetir = async () => {
  try {
    const veri = await AsyncStorage.getItem(MEVCUT_KULLANICI_ANAHTARI);
    return veri ? JSON.parse(veri) : null;
  } catch (hata) {
    console.error('Mevcut kullanıcı alınırken hata:', hata);
    return null;
  }
};

/**
 * Mevcut kullanıcıyı AsyncStorage'a kaydeden yardımcı fonksiyon
 * @param {Object|null} kullanici - Kaydedilecek kullanıcı bilgisi (null ise silinir)
 * @returns {Promise<boolean>} İşlem başarılı mı?
 */
const mevcutKullaniciiKaydet = async (kullanici) => {
  try {
    if (kullanici) {
      await AsyncStorage.setItem(MEVCUT_KULLANICI_ANAHTARI, JSON.stringify(kullanici));
    } else {
      await AsyncStorage.removeItem(MEVCUT_KULLANICI_ANAHTARI);
    }
    return true;
  } catch (hata) {
    console.error('Mevcut kullanıcı kaydedilirken hata:', hata);
    return false;
  }
};

/**
 * Kimlik Doğrulama Servisi Objesi
 * Tüm kimlik doğrulama işlemlerini içeren servis
 */
export const kimlikDogrulamaServisi = {
  /**
   * Yeni kullanıcı kaydı oluşturur
   * @param {string} eposta - Kullanıcı e-posta adresi
   * @param {string} sifre - Kullanıcı şifresi
   * @param {string} gorunenIsim - Kullanıcı görünen adı
   * @returns {Promise<Object>} İşlem sonucu ve kullanıcı bilgisi
   */
  kayitOl: async (eposta, sifre, gorunenIsim) => {
    try {
      const kullanicilar = await tumKullanicilariGetir();
      
      // Kullanıcının zaten var olup olmadığını kontrol et
      const mevcutKullanici = kullanicilar.find(k => k.email === eposta);
      if (mevcutKullanici) {
        return { success: false, error: 'Bu e-posta adresi zaten kullanılıyor' };
      }
      
      // Yeni kullanıcı oluştur
      const yeniKullanici = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        email: eposta,
        password: sifre, // Üretimde şifrelenmeli
        displayName: gorunenIsim,
        createdAt: new Date().toISOString(),
      };
      
      kullanicilar.push(yeniKullanici);
      const kaydedildi = await tumKullanicilariKaydet(kullanicilar);
      
      if (kaydedildi) {
        // Mevcut kullanıcı olarak ayarla
        await mevcutKullaniciiKaydet(yeniKullanici);
        return { success: true, user: yeniKullanici };
      } else {
        return { success: false, error: 'Kullanıcı kaydedilemedi' };
      }
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  },

  /**
   * Kullanıcı girişi yapar
   * @param {string} eposta - Kullanıcı e-posta adresi
   * @param {string} sifre - Kullanıcı şifresi
   * @returns {Promise<Object>} İşlem sonucu ve kullanıcı bilgisi
   */
  girisYap: async (eposta, sifre) => {
    try {
      const kullanicilar = await tumKullanicilariGetir();
      const kullanici = kullanicilar.find(k => k.email === eposta && k.password === sifre);
      
      if (!kullanici) {
        return { success: false, error: 'E-posta veya şifre hatalı' };
      }
      
      // Mevcut kullanıcı olarak ayarla
      await mevcutKullaniciiKaydet(kullanici);
      return { success: true, user: kullanici };
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  },

  /**
   * Kullanıcı çıkışı yapar
   * @returns {Promise<Object>} İşlem sonucu
   */
  cikisYap: async () => {
    try {
      await mevcutKullaniciiKaydet(null);
      return { success: true };
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  },

  /**
   * Kimlik doğrulama durumu değişikliklerini dinler (simüle edilmiş)
   * @param {Function} geriCagirma - Durum değiştiğinde çağrılacak fonksiyon
   * @returns {Function} Abonelik iptal fonksiyonu
   */
  kimlikDurumuDegisikliginiDinle: (geriCagirma) => {
    // Mevcut kullanıcıyı hemen kontrol et
    mevcutKullaniciiGetir().then(kullanici => {
      geriCagirma(kullanici);
    });
    
    // Abone olmayı iptal eden fonksiyon döndür (yerel depolama için no-op)
    return () => {};
  },

  /**
   * Mevcut kullanıcıyı getirir
   * @returns {Promise<Object|null>} Mevcut kullanıcı bilgisi
   */
  mevcutKullaniciiGetir: async () => {
    return await mevcutKullaniciiGetir();
  },

  /**
   * Mevcut kullanıcıyı senkron olarak getirir (anında erişim için)
   * @returns {Object|null} Mevcut kullanıcı bilgisi (AuthContext tarafından yönetilir)
   */
  mevcutKullaniciiSenkronGetir: () => {
    // Bu AuthContext tarafından yönetilecek
    return null;
  },

  /**
   * Profil bilgilerini günceller
   * @param {string} kullaniciId - Güncellenecek kullanıcı ID'si
   * @param {Object} guncellemeler - Güncellenecek alanlar
   * @returns {Promise<Object>} İşlem sonucu ve güncellenmiş kullanıcı bilgisi
   */
  profiliGuncelle: async (kullaniciId, guncellemeler) => {
    try {
      const kullanicilar = await tumKullanicilariGetir();
      const kullaniciIndeksi = kullanicilar.findIndex(k => k.id === kullaniciId);
      
      if (kullaniciIndeksi === -1) {
        return { success: false, error: 'Kullanıcı bulunamadı' };
      }
      
      // Kullanıcı verilerini güncelle
      kullanicilar[kullaniciIndeksi] = {
        ...kullanicilar[kullaniciIndeksi],
        ...guncellemeler,
        updatedAt: new Date().toISOString(),
      };
      
      const kaydedildi = await tumKullanicilariKaydet(kullanicilar);
      
      if (kaydedildi) {
        // Aynı kullanıcıysa mevcut kullanıcıyı güncelle
        const mevcutKullanici = await mevcutKullaniciiGetir();
        if (mevcutKullanici && mevcutKullanici.id === kullaniciId) {
          await mevcutKullaniciiKaydet(kullanicilar[kullaniciIndeksi]);
        }
        return { basarili: true, kullanici: kullanicilar[kullaniciIndeksi] };
      } else {
        return { success: false, error: 'Profil güncellenemedi' };
      }
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  },

  /**
   * Kullanıcı şifresini değiştirir
   * @param {string} kullaniciId - Şifresi değiştirilecek kullanıcı ID'si
   * @param {string} mevcutSifre - Mevcut şifre
   * @param {string} yeniSifre - Yeni şifre
   * @returns {Promise<Object>} İşlem sonucu
   */
  sifreDegistir: async (kullaniciId, mevcutSifre, yeniSifre) => {
    try {
      const kullanicilar = await tumKullanicilariGetir();
      const kullaniciIndeksi = kullanicilar.findIndex(k => k.id === kullaniciId);
      
      if (kullaniciIndeksi === -1) {
        return { success: false, error: 'Kullanıcı bulunamadı' };
      }
      
      const kullanici = kullanicilar[kullaniciIndeksi];
      
      // Mevcut şifreyi kontrol et
      if (kullanici.password !== mevcutSifre) {
        return { success: false, error: 'Mevcut şifre hatalı' };
      }
      
      // Yeni şifreyi doğrula
      if (!yeniSifre || yeniSifre.length < 6) {
        return { success: false, error: 'Yeni şifre en az 6 karakter olmalıdır' };
      }
      
      // Şifreyi güncelle
      kullanicilar[kullaniciIndeksi] = {
        ...kullanicilar[kullaniciIndeksi],
        password: yeniSifre,
        updatedAt: new Date().toISOString(),
      };
      
      const kaydedildi = await tumKullanicilariKaydet(kullanicilar);
      
      if (kaydedildi) {
        // Aynı kullanıcıysa mevcut kullanıcıyı güncelle
        const mevcutKullanici = await mevcutKullaniciiGetir();
        if (mevcutKullanici && mevcutKullanici.id === kullaniciId) {
          await mevcutKullaniciiKaydet(kullanicilar[kullaniciIndeksi]);
        }
        return { success: true };
      } else {
        return { success: false, error: 'Şifre güncellenemedi' };
      }
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  }
};
