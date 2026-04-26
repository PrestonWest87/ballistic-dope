import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

const COLORS = {
  background: '#0f0f23',
  surface: '#1a1a2e',
  surfaceLight: '#252542',
  primary: '#00d4aa',
  primaryDark: '#00a88a',
  secondary: '#ff6b35',
  text: '#ffffff',
  textMuted: '#a0a0b0',
  error: '#ff4757',
  wind: '#4ecdc4',
  trajectory: '#ffd93d',
  energy: '#ff6b35',
  velocity: '#6c5ce7',
  grid: '#2d2d4a',
};

const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
};

const BORDER_RADIUS = { sm: 4, md: 8, lg: 16, full: 9999 };

interface DopePoint {
  range: number;
  drop: number;
  holdover: number;
  velocity: number;
  energy: number;
  time: number;
  windage: number;
  clicks: number;
}

const G_CONSTANT = 32.174;
const FT_TO_INCHES = 12;
const YDS_TO_FT = 3;
const GRAVITY = 32.174;

function calculateTimeOfFlight(rangeFeet: number, velocity: number, bc: number): number {
  const avgVelocity = velocity * 0.85;
  const time = rangeFeet / avgVelocity;
  const dragFactor = 1 + (rangeFeet / 1000) * 0.1;
  return time * dragFactor;
}

function calculateDrop(time: number): number {
  return 0.5 * GRAVITY * time * time * FT_TO_INCHES;
}

function calculateVelocityAtRange(initialVelocity: number, rangeFeet: number, bc: number): number {
  const dragFactor = bc * 0.01;
  const decay = Math.exp(-dragFactor * rangeFeet / initialVelocity);
  return initialVelocity * Math.max(decay, 0.3);
}

function calculateEnergy(velocity: number, bulletWeight: number): number {
  return (bulletWeight * velocity * velocity) / 450240;
}

function calculateQuickDirty(
  velocity: number,
  bc: number,
  zeroRange: number,
  maxRange: number = 1000,
  increment: number = 50
): DopePoint[] {
  const zeroFeet = zeroRange * YDS_TO_FT;
  const bulletWeight = 150;

  const dopeChart: DopePoint[] = [];
  let currentRange = 0;

  while (currentRange <= maxRange) {
    const rangeFeet = currentRange * YDS_TO_FT;
    const time = calculateTimeOfFlight(rangeFeet, velocity, bc);
    const drop = calculateDrop(time);
    const adjustedDrop = drop * (rangeFeet > zeroFeet ? (rangeFeet - zeroFeet) / rangeFeet : 0);
    const holdover = adjustedDrop - ((rangeFeet - zeroFeet) * drop / zeroFeet);
    const currentVelocity = calculateVelocityAtRange(velocity, rangeFeet, bc);
    const energy = calculateEnergy(currentVelocity, bulletWeight);
    
    let clicks = 0;
    if (currentRange > zeroRange) {
      const moaAdjustment = (holdover / (currentRange / 100)) * 3;
      clicks = moaAdjustment / 0.25;
    }

    dopeChart.push({
      range: currentRange,
      drop: Math.round(adjustedDrop * 100) / 100,
      holdover: Math.round(holdover * 100) / 100,
      velocity: Math.round(currentVelocity),
      energy: Math.round(energy),
      time: Math.round(time * 100) / 100,
      windage: 0,
      clicks: Math.round(clicks),
    });

    currentRange += increment;
  }

  return dopeChart;
}

interface InputFieldProps {
  label: string;
  value: string;
  unit: string;
  onChange: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'numeric' | 'decimal-pad';
}

function InputField({ label, value, unit, onChange, placeholder, keyboardType = 'decimal-pad' }: InputFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

export default function QuickScreen() {
  const router = useRouter();
  const [velocity, setVelocity] = useState('2800');
  const [bc, setBc] = useState('0.5');
  const [zeroRange, setZeroRange] = useState('100');
  const [results, setResults] = useState<DopePoint[] | null>(null);

  const calculate = () => {
    const v = parseFloat(velocity) || 2800;
    const b = parseFloat(bc) || 0.5;
    const z = parseFloat(zeroRange) || 100;
    const result = calculateQuickDirty(v, b, z, 1000, 50);
    setResults(result);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Inputs</Text>
        <Text style={styles.sectionDesc}>Minimum needed for rough dope</Text>

        <InputField
          label="Muzzle Velocity"
          value={velocity}
          unit="fps"
          onChange={setVelocity}
          placeholder="2800"
        />
        <InputField
          label="Ballistic Coefficient"
          value={bc}
          unit="BC"
          onChange={setBc}
          placeholder="0.5"
        />
        <InputField
          label="Zero Range"
          value={zeroRange}
          unit={results ? 'yds' : 'yds'}
          onChange={setZeroRange}
          placeholder="100"
        />

        <TouchableOpacity style={styles.button} onPress={calculate} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Calculate</Text>
        </TouchableOpacity>
      </View>

      {results && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Results</Text>
          <View style={styles.resultsCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Range</Text>
              <Text style={styles.resultLabel}>Holdover</Text>
              <Text style={styles.resultLabel}>Clicks</Text>
            </View>
            {results.map((point, idx) => (
              <View key={idx} style={styles.resultRow}>
                <Text style={styles.resultValue}>{point.range}y</Text>
                <Text style={[styles.resultValue, point.holdover < 0 && styles.negative]}>
                  {point.holdover > 0 ? '+' : ''}{point.holdover.toFixed(1)}"
                </Text>
                <Text style={styles.resultValue}>{point.clicks}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push({ pathname: '/graph', params: { data: JSON.stringify(results) } })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>View Graph</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xs },
  sectionDesc: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginBottom: SPACING.md },
  inputGroup: { marginBottom: SPACING.md },
  label: { ...TYPOGRAPHY.caption, color: COLORS.text, marginBottom: SPACING.xs },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  unit: { ...TYPOGRAPHY.body, color: COLORS.textMuted, marginLeft: SPACING.sm, width: 40 },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonText: { ...TYPOGRAPHY.body, color: COLORS.background, fontWeight: '600' },
  resultsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  resultLabel: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, flex: 1 },
  resultValue: { ...TYPOGRAPHY.body, color: COLORS.text, flex: 1 },
  negative: { color: COLORS.secondary },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: { ...TYPOGRAPHY.body, color: COLORS.primary, fontWeight: '600' },
});