/**
 * Raporlar Ekranı Bileşeni
 * Aylık finansal raporları ve grafikleri gösterir
 */

import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import BasitPastaGrafik from '../../components/SimplePieChart';
import { KimlikDogrulamaContext } from '../../context/AuthContext';
import { islemServisi } from '../../services/transactionService';
import { kategoriServisi } from '../../services/categoryService';
import OzetKarti from '../../components/SummaryCard';
import { colors, spacing, typography } from '../../constants/theme';
import { format, subMonths, addMonths } from 'date-fns';
import { tr } from 'date-fns/locale/tr';
import { Ionicons } from '@expo/vector-icons';

const RaporlarEkrani = () => {
  // Context'ten kullanıcı bilgisini al
  const { kullanici } = useContext(KimlikDogrulamaContext);
  
  // State'ler
  const [seciliTarih, setSeciliTarih] = useState(new Date());
  const [islemler, setIslemler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [ozet, setOzet] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    categoryExpenses: {},
  });
  const [yukleniyor, setYukleniyor] = useState(true);

  /**
   * Verileri yükleyen fonksiyon
   * Kategorileri ve işlemleri getirir, özeti hesaplar
   */
  const verileriYukle = useCallback(async () => {
    if (!kullanici) return;

    setYukleniyor(true);
    try {
      // Kategorileri yükle
      const kategorilerSonucu = await kategoriServisi.kullanicininKategorileriniGetir(kullanici.id);
      if (kategorilerSonucu.success) {
        setKategoriler(kategorilerSonucu.categories);
      }

      // İşlemleri yükle
      const islemlerSonucu = await islemServisi.aylikIslemleriGetir(
        kullanici.id,
        seciliTarih
      );
      if (islemlerSonucu.success) {
        setIslemler(islemlerSonucu.transactions);
        
        // Özeti hesapla
        const aylikOzet = islemServisi.aylikOzetiHesapla(
          islemlerSonucu.transactions
        );
        setOzet(aylikOzet);
      }
    } catch (hata) {
      console.error('Veri yükleme hatası:', hata);
    } finally {
      setYukleniyor(false);
    }
  }, [kullanici, seciliTarih]);

  useEffect(() => {
    if (kullanici) {
      verileriYukle();
    }
  }, [kullanici, seciliTarih, verileriYukle]);

  // Ekran odaklandığında verileri yeniden yükle
  useFocusEffect(
    useCallback(() => {
      if (kullanici) {
        verileriYukle();
      }
    }, [kullanici, verileriYukle])
  );

  /**
   * Ay değiştirme fonksiyonu
   * @param {string} yon - 'prev' (önceki) veya 'next' (sonraki)
   */
  const ayiDegistir = (yon) => {
    if (yon === 'prev') {
      setSeciliTarih(subMonths(seciliTarih, 1));
    } else {
      setSeciliTarih(addMonths(seciliTarih, 1));
    }
  };

  /**
   * Grafik verilerini hazırlayan fonksiyon
   * Kategori giderlerini grafik formatına dönüştürür
   * @returns {Array} Grafik verileri
   */
  const grafikVerileriniHazirla = () => {
    const kategoriGiderleri = ozet.categoryExpenses || {};
    const grafikVerileri = [];

    Object.keys(kategoriGiderleri).forEach((kategoriId) => {
      const kategori = kategoriServisi.kategoriIdyeGoreGetir(kategoriId, kategoriler);
      if (kategori && kategoriGiderleri[kategoriId] > 0) {
        grafikVerileri.push({
          name: kategori.name,
          amount: kategoriGiderleri[kategoriId],
          color: kategori.color,
          legendFontColor: colors.text,
          legendFontSize: 12,
        });
      }
    });

    return grafikVerileri;
  };

  const grafikVerileri = grafikVerileriniHazirla();
  const giderVarMi = ozet.totalExpense > 0;

  return (
    <ScrollView style={styles.konteyner}>
      {/* Ay Seçici */}
      <View style={styles.aySecici}>
        <TouchableOpacity onPress={() => ayiDegistir('prev')} style={styles.ayButonu}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.ayMetni}>
          {format(seciliTarih, 'MMMM yyyy', { locale: tr })}
        </Text>
        <TouchableOpacity onPress={() => ayiDegistir('next')} style={styles.ayButonu}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Özet Kartları */}
      <View style={styles.ozetBolumu}>
        <OzetKarti
          baslik="Toplam Gelir"
          tutar={ozet.totalIncome}
          ikon="arrow-down-circle"
          renk={colors.success}
        />
        <OzetKarti
          baslik="Toplam Gider"
          tutar={ozet.totalExpense}
          ikon="arrow-up-circle"
          renk={colors.error}
        />
        <OzetKarti
          baslik="Kalan Bakiye"
          tutar={ozet.balance}
          ikon="wallet"
          renk={ozet.balance >= 0 ? colors.primary : colors.warning}
        />
      </View>

      {/* Grafik Bölümü */}
      {giderVarMi && grafikVerileri.length > 0 ? (
        <View style={styles.grafikBolumu}>
          <Text style={styles.bolumBasligi}>Kategoriye Göre Gider Dağılımı</Text>
          <View style={styles.grafikKonteyner}>
            <BasitPastaGrafik data={grafikVerileri} />
          </View>
        </View>
      ) : (
        <View style={styles.bosDurum}>
          <Ionicons name="bar-chart-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.bosMetin}>Bu ay için gider verisi bulunmuyor</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  konteyner: {
    flex: 1,
    backgroundColor: colors.background,
  },
  aySecici: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  ayButonu: {
    padding: spacing.sm,
  },
  ayMetni: {
    ...typography.h3,
    color: colors.text,
  },
  ozetBolumu: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  grafikBolumu: {
    padding: spacing.lg,
  },
  bolumBasligi: {
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.text,
  },
  grafikKonteyner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
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
  },
});

export default RaporlarEkrani;
