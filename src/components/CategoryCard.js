/**
 * Kategori Kartı Bileşeni
 * Kategori seçimi için kullanılan kart bileşeni
 */

// Temel bağımlılıklar
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows } from '../constants/theme';

const KategoriKarti = ({ kategori, secili, tiklandiginda, tutar }) => {
  // Tutarı gösterime hazırlamak için formatlayıcı
  /**
   * Tutarı para birimi formatında formatlar
   * @param {number} deger - Formatlanacak tutar
   * @returns {string} Formatlanmış tutar
   */
  const tutariFormatla = (deger) => {
    if (!deger) return '';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(deger);
  };

  // Kartın görsel sunumu
  return (
    <TouchableOpacity
      style={[
        styles.kart,
        shadows.small,
        secili && styles.seciliKart,
        { borderColor: kategori.color },
      ]}
      onPress={tiklandiginda}
      activeOpacity={0.7}
    >
      <View style={[styles.ikonKonteyner, { backgroundColor: kategori.color + '20' }]}>
        <Text style={styles.ikon}>{kategori.icon}</Text>
      </View>
      <Text style={styles.isim}>{kategori.name}</Text>
      {tutar !== undefined && (
        <Text style={styles.tutar}>{tutariFormatla(tutar)}</Text>
      )}
    </TouchableOpacity>
  );
};

// Stil tanımları (tema sabitleri ile tutarlı görünüm)
const styles = StyleSheet.create({
  kart: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    marginRight: spacing.md,
    minWidth: 100,
    borderWidth: 2,
  },
  seciliKart: {
    backgroundColor: colors.primary + '10',
  },
  ikonKonteyner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ikon: {
    fontSize: 28,
  },
  isim: {
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tutar: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default KategoriKarti;
