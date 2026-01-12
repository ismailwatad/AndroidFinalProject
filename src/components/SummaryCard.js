/**
 * Özet Kartı Bileşeni
 * Finansal özet bilgilerini gösteren kart bileşeni
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const OzetKarti = ({ baslik, tutar, ikon, renk, tip = 'default' }) => {
  /**
   * Tutarı para birimi formatında formatlar
   * @param {number|string} deger - Formatlanacak tutar
   * @returns {string} Formatlanmış tutar
   */
  const tutariFormatla = (deger) => {
    // Değerin sayı olduğundan emin ol
    const sayiDegeri = typeof deger === 'number' ? deger : parseFloat(deger) || 0;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(sayiDegeri);
  };

  return (
    <View style={[styles.kart, shadows.medium, { borderLeftColor: renk }]}>
      <View style={styles.baslikAlani}>
        <Ionicons name={ikon} size={24} color={renk} />
        <Text style={styles.baslik}>{baslik}</Text>
      </View>
      <Text style={[styles.tutar, { color: renk }]}>
        {tutariFormatla(tutar)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  kart: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  baslikAlani: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  baslik: {
    ...typography.bodySmall,
    marginLeft: spacing.sm,
    color: colors.textLight,
  },
  tutar: {
    ...typography.h2,
    fontWeight: 'bold',
  },
});

export default OzetKarti;
