/**
 * IP Security Service
 * Manages IP address tracking and security for users
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const IP_SECURITY_ANAHTARI = '@ipSecurity';

/**
 * Gets user's IP security data
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} IP security data
 */
const kullaniciIpGuvenlikVerisiniGetir = async (userId) => {
  try {
    const veri = await AsyncStorage.getItem(`${IP_SECURITY_ANAHTARI}_${userId}`);
    return veri ? JSON.parse(veri) : null;
  } catch (hata) {
    console.error('IP güvenlik verisi alınırken hata:', hata);
    return null;
  }
};

/**
 * Saves user's IP security data
 * @param {string} userId - User ID
 * @param {Object} ipVerisi - IP security data
 * @returns {Promise<boolean>} Success status
 */
const kullaniciIpGuvenlikVerisiniKaydet = async (userId, ipVerisi) => {
  try {
    await AsyncStorage.setItem(`${IP_SECURITY_ANAHTARI}_${userId}`, JSON.stringify(ipVerisi));
    return true;
  } catch (hata) {
    console.error('IP güvenlik verisi kaydedilirken hata:', hata);
    return false;
  }
};

/**
 * Gets current IP address (simulated - in production, use a real IP service)
 * @returns {Promise<string>} Current IP address
 */
const mevcutIpAdresiniGetir = async () => {
  try {
    // In a real app, you would call an IP service API
    // For now, we'll simulate with a stored value or generate one
    const storedIp = await AsyncStorage.getItem('@currentIP');
    if (storedIp) {
      return storedIp;
    }
    
    // Generate a simulated IP (in production, get from API)
    // Format: xxx.xxx.xxx.xxx
    const simulatedIp = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    await AsyncStorage.setItem('@currentIP', simulatedIp);
    return simulatedIp;
  } catch (hata) {
    console.error('IP adresi alınırken hata:', hata);
    // Fallback IP
    return '0.0.0.0';
  }
};

/**
 * IP Security Service Object
 */
export const ipGuvenlikServisi = {
  /**
   * Checks if IP address has changed and records it
   * @param {string} userId - User ID
   * @returns {Promise<Object>} IP check result with warning if changed
   */
  ipAdresiniKontrolEt: async (userId) => {
    try {
      const mevcutIp = await mevcutIpAdresiniGetir();
      const ipGuvenlikVerisi = await kullaniciIpGuvenlikVerisiniGetir(userId);

      if (!ipGuvenlikVerisi) {
        // First time login - save IP
        await kullaniciIpGuvenlikVerisiniKaydet(userId, {
          kayitliIp: mevcutIp,
          sonGirisIp: mevcutIp,
          sonGirisTarihi: new Date().toISOString(),
          ipDegisiklikleri: [],
        });
        return {
          success: true,
          ipChanged: false,
          warning: null,
        };
      }

      const sonGirisIp = ipGuvenlikVerisi.sonGirisIp;
      const kayitliIp = ipGuvenlikVerisi.kayitliIp;

      // Check if IP changed
      if (mevcutIp !== sonGirisIp && mevcutIp !== kayitliIp) {
        // IP changed - record it
        const ipDegisiklikleri = ipGuvenlikVerisi.ipDegisiklikleri || [];
        ipDegisiklikleri.push({
          eskiIp: sonGirisIp,
          yeniIp: mevcutIp,
          tarih: new Date().toISOString(),
        });

        await kullaniciIpGuvenlikVerisiniKaydet(userId, {
          ...ipGuvenlikVerisi,
          sonGirisIp: mevcutIp,
          sonGirisTarihi: new Date().toISOString(),
          ipDegisiklikleri: ipDegisiklikleri.slice(-10), // Keep last 10 changes
        });

        return {
          success: true,
          ipChanged: true,
          warning: {
            message: 'IP adresi değişikliği tespit edildi. Eğer siz değilseniz, lütfen şifrenizi değiştirin.',
            oldIp: sonGirisIp,
            newIp: mevcutIp,
          },
        };
      }

      // IP not changed - update last login time
      await kullaniciIpGuvenlikVerisiniKaydet(userId, {
        ...ipGuvenlikVerisi,
        sonGirisTarihi: new Date().toISOString(),
      });

      return {
        success: true,
        ipChanged: false,
        warning: null,
      };
    } catch (hata) {
      console.error('IP kontrolü sırasında hata:', hata);
      return {
        success: false,
        error: hata.message,
        ipChanged: false,
        warning: null,
      };
    }
  },

  /**
   * Gets IP security history for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} IP security history
   */
  ipGuvenlikGecmisiniGetir: async (userId) => {
    try {
      const ipGuvenlikVerisi = await kullaniciIpGuvenlikVerisiniGetir(userId);
      if (!ipGuvenlikVerisi) {
        return {
          success: true,
          data: null,
        };
      }

      return {
        success: true,
        data: {
          kayitliIp: ipGuvenlikVerisi.kayitliIp,
          sonGirisIp: ipGuvenlikVerisi.sonGirisIp,
          sonGirisTarihi: ipGuvenlikVerisi.sonGirisTarihi,
          ipDegisiklikleri: ipGuvenlikVerisi.ipDegisiklikleri || [],
        },
      };
    } catch (hata) {
      return {
        success: false,
        error: hata.message,
      };
    }
  },

  /**
   * Updates registered IP (when user confirms it's safe)
   * @param {string} userId - User ID
   * @param {string} yeniIp - New IP to register
   * @returns {Promise<Object>} Update result
   */
  kayitliIpGuncelle: async (userId, yeniIp) => {
    try {
      const ipGuvenlikVerisi = await kullaniciIpGuvenlikVerisiniGetir(userId);
      if (!ipGuvenlikVerisi) {
        return {
          success: false,
          error: 'IP güvenlik verisi bulunamadı',
        };
      }

      await kullaniciIpGuvenlikVerisiniKaydet(userId, {
        ...ipGuvenlikVerisi,
        kayitliIp: yeniIp,
        sonGirisIp: yeniIp,
      });

      return {
        success: true,
      };
    } catch (hata) {
      return {
        success: false,
        error: hata.message,
      };
    }
  },
};
