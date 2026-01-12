/**
 * Ana Sayfa Ekranı Bileşeni
 * Kullanıcının finansal özetini ve son işlemlerini gösterir
 */

import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { KimlikDogrulamaContext } from '../../context/AuthContext';
import { islemServisi } from '../../services/transactionService';
import { kategoriServisi } from '../../services/categoryService';
import OzetKarti from '../../components/SummaryCard';
import IslemKarti from '../../components/TransactionCard';
import { colors, spacing, typography } from '../../constants/theme';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale/tr';
import { Ionicons } from '@expo/vector-icons';

const AnaSayfaEkrani = ({ navigation }) => {
  // Context'ten kullanıcı bilgisini al
  const { kullanici } = useContext(KimlikDogrulamaContext);
  
  // State'ler
  const [islemler, setIslemler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [ozet, setOzet] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);

  // Mevcut tarih ve ay bilgisi
  const mevcutTarih = new Date();
  const mevcutAy = format(mevcutTarih, 'MMMM yyyy', { locale: tr });

  /**
   * Verileri yükleyen fonksiyon
   * Kategorileri ve işlemleri getirir, özeti hesaplar
   */
  const verileriYukle = useCallback(async () => {
    if (!kullanici) return;

    setYukleniyor(true);
    try {
      const bugun = new Date();
      
      // Kategorileri yükle
      const kategorilerSonucu = await kategoriServisi.kullanicininKategorileriniGetir(kullanici.id);
      if (kategorilerSonucu.success) {
        setKategoriler(kategorilerSonucu.categories);
      }

      // İşlemleri yükle
      const islemlerSonucu = await islemServisi.aylikIslemleriGetir(
        kullanici.id,
        bugun
      );
      if (islemlerSonucu.success) {
        setIslemler(islemlerSonucu.transactions);
        
        // Özeti hesapla
        const aylikOzet = islemServisi.aylikOzetiHesapla(
          islemlerSonucu.transactions
        );
        
        // Özet state'ini açık değerlerle güncelle
        setOzet({
          totalIncome: aylikOzet.totalIncome || 0,
          totalExpense: aylikOzet.totalExpense || 0,
          balance: aylikOzet.balance || 0,
        });
      }
    } catch (hata) {
      console.error('Veri yükleme hatası:', hata);
    } finally {
      setYukleniyor(false);
    }
  }, [kullanici]);

  // Ekran odaklandığında verileri yeniden yükle
  useFocusEffect(
    useCallback(() => {
      if (kullanici) {
        verileriYukle();
      }
    }, [kullanici, verileriYukle])
  );

  /**
   * Yenileme işlemini gerçekleştiren fonksiyon
   */
  const yenile = async () => {
    setYenileniyor(true);
    await verileriYukle();
    setYenileniyor(false);
  };

  /**
   * İşlem silme işlemini gerçekleştiren fonksiyon
   * @param {string} islemId - Silinecek işlem ID'si
   */
  const islemiSil = async (islemId) => {
    const sonuc = await islemServisi.islemSil(islemId);
    if (sonuc.success) {
      await verileriYukle();
    }
  };

  /**
   * Kategori ID'sine göre kategori bilgisini getiren fonksiyon
   * @param {string} kategoriId - Aranacak kategori ID'si
   * @returns {Object} Kategori bilgisi
   */
  const kategoriIdyeGoreGetir = (kategoriId) => {
    return kategoriServisi.kategoriIdyeGoreGetir(kategoriId, kategoriler);
  };

  // Son 10 işlemi al
  const sonIslemler = islemler.slice(0, 10);

  return (
    <ScrollView
      style={styles.konteyner}
      refreshControl={
        <RefreshControl refreshing={yenileniyor} onRefresh={yenile} />
      }
    >
      <View style={styles.baslikAlani}>
        <Text style={styles.ayMetni}>{mevcutAy}</Text>
      </View>

      <View style={styles.ozetBolumu}>
        <OzetKarti
          key={`income-${ozet.totalIncome}`}
          baslik="Toplam Gelir"
          tutar={ozet.totalIncome}
          ikon="arrow-down-circle"
          renk={colors.success}
        />
        <OzetKarti
          key={`expense-${ozet.totalExpense}`}
          baslik="Toplam Gider"
          tutar={ozet.totalExpense}
          ikon="arrow-up-circle"
          renk={colors.error}
        />
        <OzetKarti
          key={`balance-${ozet.balance}`}
          baslik="Kalan Bakiye"
          tutar={ozet.balance}
          ikon="wallet"
          renk={ozet.balance >= 0 ? colors.primary : colors.warning}
        />
      </View>

      <View style={styles.islemlerBolumu}>
        <View style={styles.bolumBasligi}>
          <Text style={styles.bolumBasligiMetni}>Son İşlemler</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddTransaction')}
            style={styles.ekleButonu}
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {sonIslemler.length === 0 ? (
          <View style={styles.bosDurum}>
            <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.bosMetin}>Henüz işlem bulunmuyor</Text>
            <Text style={styles.bosAltMetin}>Yeni işlem eklemek için + butonuna tıklayın</Text>
          </View>
        ) : (
          sonIslemler.map((islem) => (
            <IslemKarti
              key={islem.id}
              islem={islem}
              kategori={kategoriIdyeGoreGetir(islem.category)}
              tiklandiginda={() => navigation.navigate('AddTransaction', { transaction: islem })}
              silindiginde={islemiSil}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  konteyner: {
    flex: 1,
    backgroundColor: colors.background,
  },
  baslikAlani: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  ayMetni: {
    ...typography.h2,
    color: colors.text,
  },
  ozetBolumu: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  islemlerBolumu: {
    padding: spacing.lg,
  },
  bolumBasligi: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bolumBasligiMetni: {
    ...typography.h3,
    color: colors.text,
  },
  ekleButonu: {
    padding: spacing.xs,
  },
  bosDurum: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  bosMetin: {
    ...typography.body,
    color: colors.textLight,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  bosAltMetin: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default AnaSayfaEkrani;
