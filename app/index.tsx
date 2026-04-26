import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../packages/theme/src';

const modes = [
  { key: 'quick', title: 'Quick Dirty', desc: 'Minimal inputs, fast dope', icon: '⚡' },
  { key: 'advanced', title: 'Advanced', desc: 'Scope adjustment settings', icon: '🎯' },
  { key: 'long-range', title: 'Long Range', desc: 'Environmental factors', icon: '📊' },
  { key: 'extreme', title: 'Extreme', desc: 'Coriolis + spread estimation', icon: '🎯' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Ballistic Dope</Text>
        <Text style={styles.subtitle}>Choose your calculation mode</Text>
      </View>

      <View style={styles.modes}>
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={styles.card}
            onPress={() => router.push(`/${mode.key}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{mode.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{mode.title}</Text>
              <Text style={styles.cardDesc}>{mode.desc}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0 • Mobile-first ballistics</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  header: { paddingVertical: SPACING.xl, alignItems: 'center' },
  title: { ...TYPOGRAPHY.h1, color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  modes: { gap: SPACING.md },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  icon: { fontSize: 32, marginRight: SPACING.md },
  cardContent: { flex: 1 },
  cardTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.xs },
  cardDesc: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  arrow: { fontSize: 24, color: COLORS.textMuted },
  footer: { paddingVertical: SPACING.xl, alignItems: 'center' },
  footerText: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
});