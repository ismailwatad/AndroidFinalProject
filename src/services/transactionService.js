/**
 * İşlem Servisi
 * Gelir ve gider işlemlerini yöneten servis
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

// AsyncStorage anahtarı
const ISLEMLER_ANAHTARI = '@transactions';

/**
 * Tüm işlemleri AsyncStorage'dan getiren yardımcı fonksiyon
 * @returns {Promise<Array>} İşlem listesi
 */
const tumIslemleriGetir = async () => {
  try {
    const veri = await AsyncStorage.getItem(ISLEMLER_ANAHTARI);
    return veri ? JSON.parse(veri) : [];
  } catch (hata) {
    console.error('İşlemler alınırken hata:', hata);
    return [];
  }
};

/**
 * Tüm işlemleri AsyncStorage'a kaydeden yardımcı fonksiyon
 * @param {Array} islemler - Kaydedilecek işlem listesi
 * @returns {Promise<boolean>} İşlem başarılı mı?
 */
const tumIslemleriKaydet = async (islemler) => {
  try {
    await AsyncStorage.setItem(ISLEMLER_ANAHTARI, JSON.stringify(islemler));
    return true;
  } catch (hata) {
    console.error('İşlemler kaydedilirken hata:', hata);
    return false;
  }
};

/**
 * İşlem Servisi Objesi
 * Tüm işlem işlemlerini içeren servis
 */
export const islemServisi = {
  /**
   * Yeni işlem ekler
   * @param {string} kullaniciId - İşlemi ekleyen kullanıcı ID'si
   * @param {Object} islemVerisi - İşlem bilgileri
   * @returns {Promise<Object>} İşlem sonucu ve işlem ID'si
   */
  islemEkle: async (kullaniciId, islemVerisi) => {
    try {
      const islemler = await tumIslemleriGetir();
      const yeniIslem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...islemVerisi,
        userId: kullaniciId,
        date: islemVerisi.date instanceof Date 
          ? islemVerisi.date.toISOString() 
          : islemVerisi.date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      islemler.push(yeniIslem);
      const kaydedildi = await tumIslemleriKaydet(islemler);
      
      if (kaydedildi) {
        return { success: true, id: yeniIslem.id };
      } else {
        return { success: false, error: 'İşlem kaydedilemedi' };
      }
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  },

  /**
   * Mevcut işlemi günceller
   * @param {string} islemId - Güncellenecek işlem ID'si
   * @param {Object} islemVerisi - Güncellenecek işlem bilgileri
   * @returns {Promise<Object>} İşlem sonucu
   */
  islemGuncelle: async (islemId, islemVerisi) => {
    try {
      const islemler = await tumIslemleriGetir();
      const indeks = islemler.findIndex(i => i.id === islemId);
      
      if (indeks === -1) {
        return { success: false, error: 'İşlem bulunamadı' };
      }
      
      islemler[indeks] = {
        ...islemler[indeks],
        ...islemVerisi,
        date: islemVerisi.date instanceof Date 
          ? islemVerisi.date.toISOString() 
          : islemVerisi.date || islemler[indeks].date,
        updatedAt: new Date().toISOString(),
      };
      
      const kaydedildi = await tumIslemleriKaydet(islemler);
      return kaydedildi ? { success: true } : { success: false, error: 'İşlem güncellenemedi' };
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  },

  /**
   * İşlemi siler
   * @param {string} islemId - Silinecek işlem ID'si
   * @returns {Promise<Object>} İşlem sonucu
   */
  islemSil: async (islemId) => {
    try {
      const islemler = await tumIslemleriGetir();
      const filtrelenmisIslemler = islemler.filter(i => i.id !== islemId);
      const kaydedildi = await tumIslemleriKaydet(filtrelenmisIslemler);
      return kaydedildi ? { success: true } : { success: false, error: 'İşlem silinemedi' };
    } catch (hata) {
      return { success: false, error: hata.message };
    }
  },

  /**
   * Kullanıcının tüm işlemlerini getirir
   * @param {string} kullaniciId - Kullanıcı ID'si
   * @returns {Promise<Object>} İşlem sonucu ve işlem listesi
   */
  kullanicininIslemleriniGetir: async (kullaniciId) => {
    try {
      const islemler = await tumIslemleriGetir();
      const kullaniciIslemleri = islemler
        .filter(i => i.userId === kullaniciId)
        .map(i => ({
          ...i,
          date: i.date ? (typeof i.date === 'string' ? parseISO(i.date) : i.date) : new Date(),
        }))
        .sort((a, b) => {
          const tarihA = a.date instanceof Date ? a.date : parseISO(a.date);
          const tarihB = b.date instanceof Date ? b.date : parseISO(b.date);
          return tarihB - tarihA; // Azalan sıra
        });
      
      return { success: true, transactions: kullaniciIslemleri };
    } catch (hata) {
      return { success: false, error: hata.message, transactions: [] };
    }
  },

  /**
   * Belirli bir ayın işlemlerini getirir
   * @param {string} kullaniciId - Kullanıcı ID'si
   * @param {Date} ayTarihi - Ay tarihi
   * @returns {Promise<Object>} İşlem sonucu ve işlem listesi
   */
  aylikIslemleriGetir: async (kullaniciId, ayTarihi) => {
    try {
      const baslangicTarihi = startOfMonth(ayTarihi);
      const bitisTarihi = endOfMonth(ayTarihi);
      
      const islemler = await tumIslemleriGetir();
      const kullaniciIslemleri = islemler
        .filter(i => {
          if (i.userId !== kullaniciId) return false;
          
          const islemTarihi = i.date 
            ? (typeof i.date === 'string' ? parseISO(i.date) : new Date(i.date))
            : new Date();
          
          return isWithinInterval(islemTarihi, { start: baslangicTarihi, end: bitisTarihi });
        })
        .map(i => ({
          ...i,
          date: i.date ? (typeof i.date === 'string' ? parseISO(i.date) : i.date) : new Date(),
        }))
        .sort((a, b) => {
          const tarihA = a.date instanceof Date ? a.date : parseISO(a.date);
          const tarihB = b.date instanceof Date ? b.date : parseISO(b.date);
          return tarihB - tarihA; // Azalan sıra
        });
      
      return { success: true, transactions: kullaniciIslemleri };
    } catch (hata) {
      return { success: false, error: hata.message, transactions: [] };
    }
  },

  /**
   * Aylık finansal özeti hesaplar
   * @param {Array} islemler - Hesaplanacak işlem listesi
   * @returns {Object} Özet bilgileri (toplam gelir, toplam gider, bakiye, kategori giderleri)
   */
  aylikOzetiHesapla: (islemler) => {
    let toplamGelir = 0;
    let toplamGider = 0;
    const kategoriGiderleri = {};

    islemler.forEach((islem) => {
      // Tutarın sayı olduğundan emin ol
      const tutar = typeof islem.amount === 'number' 
        ? islem.amount 
        : parseFloat(islem.amount) || 0;

      if (islem.type === 'income') {
        toplamGelir += tutar;
      } else if (islem.type === 'expense') {
        toplamGider += tutar;
        
        if (islem.category) {
          kategoriGiderleri[islem.category] = 
            (kategoriGiderleri[islem.category] || 0) + tutar;
        }
      }
    });

    const bakiye = toplamGelir - toplamGider;

    return {
      totalIncome: Number(toplamGelir.toFixed(2)),
      totalExpense: Number(toplamGider.toFixed(2)),
      balance: Number(bakiye.toFixed(2)),
      categoryExpenses: kategoriGiderleri,
    };
  }
};
