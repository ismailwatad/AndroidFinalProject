/**
 * Kimlik Doğrulama Context
 * Uygulama genelinde kullanıcı kimlik doğrulama durumunu yönetir
 */

import React, { createContext, useState, useEffect } from 'react';
import { kimlikDogrulamaServisi } from '../services/authService';
import { ipGuvenlikServisi } from '../services/ipSecurityService';
import { Alert } from 'react-native';

export const KimlikDogrulamaContext = createContext();

/**
 * Kimlik Doğrulama Provider Bileşeni
 * Tüm uygulamayı kimlik doğrulama durumu ile sarar
 */
export const KimlikDogrulamaProvider = ({ children }) => {
  // Kullanıcı durumu
  const [kullanici, setKullanici] = useState(null);
  // Yükleme durumu
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    /**
     * Yükleme sırasında mevcut kullanıcıyı kontrol eden fonksiyon
     */
    const kullaniciyiKontrolEt = async () => {
      const mevcutKullanici = await kimlikDogrulamaServisi.mevcutKullaniciiGetir();
      setKullanici(mevcutKullanici);
      setYukleniyor(false);
    };

    kullaniciyiKontrolEt();

    // Kimlik durumu değişikliklerini dinle
    const aboneligiIptalEt = kimlikDogrulamaServisi.kimlikDurumuDegisikliginiDinle((kullanici) => {
      setKullanici(kullanici);
      setYukleniyor(false);
    });

    return aboneligiIptalEt;
  }, []);

  /**
   * Yeni kullanıcı kaydı oluşturur
   * @param {string} eposta - Kullanıcı e-posta adresi
   * @param {string} sifre - Kullanıcı şifresi
   * @param {string} gorunenIsim - Kullanıcı görünen adı
   * @returns {Promise<Object>} İşlem sonucu
   */
  const kayitOl = async (eposta, sifre, gorunenIsim) => {
    const sonuc = await kimlikDogrulamaServisi.kayitOl(eposta, sifre, gorunenIsim);
    if (sonuc.success) {
      setKullanici(sonuc.user);
    }
    return sonuc;
  };

  /**
   * Kullanıcı girişi yapar
   * @param {string} eposta - Kullanıcı e-posta adresi
   * @param {string} sifre - Kullanıcı şifresi
   * @returns {Promise<Object>} İşlem sonucu
   */
  const girisYap = async (eposta, sifre) => {
    const sonuc = await kimlikDogrulamaServisi.girisYap(eposta, sifre);
    if (sonuc.success) {
      setKullanici(sonuc.user);
      
      // IP security check
      const ipKontrolSonucu = await ipGuvenlikServisi.ipAdresiniKontrolEt(sonuc.user.id);
      if (ipKontrolSonucu.success && ipKontrolSonucu.ipChanged && ipKontrolSonucu.warning) {
        // Show warning alert
        Alert.alert(
          'Güvenlik Uyarısı',
          ipKontrolSonucu.warning.message,
          [
            {
              text: 'Tamam',
              onPress: () => {},
            },
          ]
        );
      }
    }
    return sonuc;
  };

  /**
   * Kullanıcı çıkışı yapar
   * @returns {Promise<Object>} İşlem sonucu
   */
  const cikisYap = async () => {
    const sonuc = await kimlikDogrulamaServisi.cikisYap();
    if (sonuc.success) {
      setKullanici(null);
    }
    return sonuc;
  };

  return (
    <KimlikDogrulamaContext.Provider value={{ kullanici, yukleniyor, kayitOl, girisYap, cikisYap, setKullanici }}>
      {children}
    </KimlikDogrulamaContext.Provider>
  );
};
