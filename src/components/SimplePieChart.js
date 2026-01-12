/**
 * Basit Pasta Grafik Bileşeni
 * Kategori giderlerini pasta grafik olarak gösterir
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { colors, spacing, typography } from '../constants/theme';

const { width } = Dimensions.get('window');
const GRAFIK_BOYUTU = Math.min(width - spacing.lg * 4, 280);
const MERKEZ_X = GRAFIK_BOYUTU / 2;
const MERKEZ_Y = GRAFIK_BOYUTU / 2;
const YARICAP = (GRAFIK_BOYUTU - 40) / 2;

const BasitPastaGrafik = ({ data }) => {
  // Veri kontrolü
  if (!data || data.length === 0) {
    return (
      <View style={styles.bosKonteyner}>
        <Text style={styles.bosMetin}>Veri bulunamadı</Text>
      </View>
    );
  }

  /**
   * Toplam tutarı hesaplar
   */
  const toplam = data.reduce((toplam, oge) => {
    const tutar = typeof oge.amount === 'number' ? oge.amount : parseFloat(oge.amount) || 0;
    return toplam + tutar;
  }, 0);
  
  if (toplam === 0) {
    return (
      <View style={styles.bosKonteyner}>
        <Text style={styles.bosMetin}>Veri bulunamadı</Text>
      </View>
    );
  }

  /**
   * Açıyı radyana çevirir
   * @param {number} aci - Derece cinsinden açı
   * @returns {number} Radyan cinsinden açı
   */
  const radyanaCevir = (aci) => (aci * Math.PI) / 180;

  /**
   * Pasta dilimi için SVG yol oluşturur
   * @param {number} baslangicAci - Başlangıç açısı (derece)
   * @param {number} bitisAci - Bitiş açısı (derece)
   * @returns {string} SVG path verisi
   */
  const yayYoluOlustur = (baslangicAci, bitisAci) => {
    const baslangicAciRad = radyanaCevir(baslangicAci);
    const bitisAciRad = radyanaCevir(bitisAci);
    
    const x1 = MERKEZ_X + YARICAP * Math.cos(baslangicAciRad);
    const y1 = MERKEZ_Y + YARICAP * Math.sin(baslangicAciRad);
    const x2 = MERKEZ_X + YARICAP * Math.cos(bitisAciRad);
    const y2 = MERKEZ_Y + YARICAP * Math.sin(bitisAciRad);
    
    const buyukYayBayragi = bitisAci - baslangicAci > 180 ? 1 : 0;
    
    return `M ${MERKEZ_X} ${MERKEZ_Y} L ${x1} ${y1} A ${YARICAP} ${YARICAP} 0 ${buyukYayBayragi} 1 ${x2} ${y2} Z`;
  };
  
  /**
   * Açılarla segmentleri hesaplar
   */
  let mevcutAci = -90; // Üstten başla
  const segmentler = data.map((oge) => {
    const tutar = typeof oge.amount === 'number' ? oge.amount : parseFloat(oge.amount) || 0;
    const yuzde = tutar / toplam;
    const aci = yuzde * 360;
    const baslangicAci = mevcutAci;
    const bitisAci = mevcutAci + aci;
    mevcutAci = bitisAci;

    return {
      ...oge,
      amount: tutar,
      percentage: (yuzde * 100).toFixed(1),
      baslangicAci,
      bitisAci,
      yol: yayYoluOlustur(baslangicAci, bitisAci),
    };
  });

  return (
    <View style={styles.konteyner}>
      <View style={styles.grafikSarayici}>
        <Svg width={GRAFIK_BOYUTU} height={GRAFIK_BOYUTU} viewBox={`0 0 ${GRAFIK_BOYUTU} ${GRAFIK_BOYUTU}`}>
          <G>
            {segmentler.map((segment, indeks) => (
              <Path
                key={indeks}
                d={segment.yol}
                fill={segment.color}
                opacity={0.85}
                stroke={colors.surface}
                strokeWidth={2}
              />
            ))}
          </G>
        </Svg>
      </View>
      
      {/* Açıklama */}
      <View style={styles.aciklama}>
        {segmentler.map((segment, indeks) => (
          <View key={indeks} style={styles.aciklamaOgesi}>
            <View style={[styles.aciklamaRenk, { backgroundColor: segment.color }]} />
            <View style={styles.aciklamaMetinKonteyner}>
              <Text style={styles.aciklamaIsim}>{segment.name}</Text>
              <Text style={styles.aciklamaYuzde}>{segment.percentage}%</Text>
            </View>
            <Text style={styles.aciklamaTutar}>
              {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 2,
              }).format(segment.amount)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  konteyner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  grafikSarayici: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: GRAFIK_BOYUTU,
    height: GRAFIK_BOYUTU,
  },
  bosKonteyner: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  bosMetin: {
    ...typography.body,
    color: colors.textSecondary,
  },
  aciklama: {
    width: '100%',
    marginTop: spacing.md,
  },
  aciklamaOgesi: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  aciklamaRenk: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: spacing.sm,
  },
  aciklamaMetinKonteyner: {
    flex: 1,
  },
  aciklamaIsim: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  aciklamaYuzde: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  aciklamaTutar: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
});

export default BasitPastaGrafik;
