/**
 * İşlem Kartı Bileşeni
 * Tek bir işlemi (gelir/gider) gösteren kart bileşeni
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows } from '../constants/theme';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale/tr';
import { Ionicons } from '@expo/vector-icons';

const IslemKarti = ({ islem, kategori, tiklandiginda, silindiginde }) => {
  /**
   * Tutarı para birimi formatında formatlar
   * @param {number} deger - Formatlanacak tutar
   * @returns {string} Formatlanmış tutar
   */
  const tutariFormatla = (deger) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(deger);
  };

  // İşlem tipini kontrol et
  const gelirMi = islem.type === 'income';
  // Kategori bilgilerini al veya varsayılan kullan
  const kategoriBilgisi = kategori || { name: 'Para', icon: '💵', color: colors.textSecondary };

  return (
    <TouchableOpacity
      style={[styles.kart, shadows.small]}
      onPress={tiklandiginda}
      activeOpacity={0.7}
    >
      <View style={styles.solBolum}>
        <View style={[styles.ikonKonteyner, { backgroundColor: kategoriBilgisi.color + '20' }]}>
          <Text style={styles.ikon}>{kategoriBilgisi.icon}</Text>
        </View>
        <View style={styles.bilgi}>
          <Text style={styles.kategori}>{kategoriBilgisi.name}</Text>
          <Text style={styles.tarih}>
            {format(islem.date, 'dd MMMM yyyy', { locale: tr })}
          </Text>
        </View>
      </View>
      <View style={styles.sagBolum}>
        <Text
          style={[
            styles.tutar,
            { color: gelirMi ? colors.success : colors.error },
          ]}
        >
          {gelirMi ? '+' : '-'} {tutariFormatla(islem.amount)}
        </Text>
        {silindiginde && (
          <TouchableOpacity
            onPress={() => silindiginde(islem.id)}
            style={styles.silButonu}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  kart: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  solBolum: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ikonKonteyner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  ikon: {
    fontSize: 24,
  },
  bilgi: {
    flex: 1,
  },
  kategori: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  tarih: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sagBolum: {
    alignItems: 'flex-end',
  },
  tutar: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  silButonu: {
    padding: spacing.xs,
  },
});

export default IslemKarti;
