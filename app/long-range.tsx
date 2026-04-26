import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';

const COLORS = {
  background: '#0f0f23',
  surface: '#1a1a2e',
  surfaceLight: '#252542',
  primary: '#00d4aa',
  secondary: '#ff6b35',
  text: '#ffffff',
  textMuted: '#a0a0b0',
};

const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

const TYPOGRAPHY = {
  h2: { fontSize: 22, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
};

const BORDER_RADIUS = { sm: 4, md: 8, lg: 16, full: 9999 };

const FT_TO_INCHES = 12;
const YDS_TO_FT = 3;
const GRAVITY = 32.174;

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

function standardAtmosphere(altitude: number, temperature: number, humidity: number): number {
  const basePressure = 29.92;
  const baseTemp = 59;
  const lapseRate = 0.00356;
  const pressureAlt = basePressure * Math.pow(1 - lapseRate * altitude / baseTemp, 5.256);
  const tempCorr = baseTemp / (temperature + 459.67);
  const humidityCorr = 1 - 0.0001 * humidity;
  return pressureAlt * tempCorr * humidityCorr;
}

function adjustVelocityForAtmosphere(velocity: number, altitude: number, temperature: number, humidity: number): number {
  const densityRatio = standardAtmosphere(altitude, temperature, humidity) / 29.92;
  return velocity * Math.sqrt(1 / densityRatio);
}

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

function calculateWindage(windSpeed: number, windAngle: number, time: number): number {
  const angleRad = (windAngle * Math.PI) / 180;
  const windComponent = windSpeed * Math.sin(angleRad);
  return windComponent * time * FT_TO_INCHES * 0.8;
}

function calculateAdvanced(
  velocity: number,
  bc: number,
  zeroRange: number,
  sightHeight: number,
  clicksPerMOA: number,
  maxRange: number = 1000,
  increment: number = 50
): DopePoint[] {
  const zeroFeet = zeroRange * YDS_TO_FT;
  const bulletWeight = 150;
  const sightHeightInches = sightHeight;

  const dopeChart: DopePoint[] = [];
  let currentRange = 0;

  while (currentRange <= maxRange) {
    const rangeFeet = currentRange * YDS_TO_FT;
    const time = calculateTimeOfFlight(rangeFeet, velocity, bc);
    let drop = calculateDrop(time);
    
    const heightCorrection = sightHeightInches * (rangeFeet * rangeFeet) / (rangeFeet * rangeFeet + 470000);
    drop = drop - heightCorrection;
    
    const adjustedDrop = rangeFeet <= zeroFeet ? drop * (zeroFeet - rangeFeet) / zeroFeet : drop;
    const holdover = adjustedDrop;
    const currentVelocity = calculateVelocityAtRange(velocity, rangeFeet, bc);
    const energy = calculateEnergy(currentVelocity, bulletWeight);
    
    let clicks = 0;
    if (clicksPerMOA > 0 && Math.abs(holdover) > 0.01) {
      const moaAtRange = (holdover / (currentRange / 100)) * 3;
      clicks = moaAtRange / clicksPerMOA;
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

function calculateLongRange(
  velocity: number,
  bc: number,
  zeroRange: number,
  sightHeight: number,
  clicksPerMOA: number,
  temperature: number,
  altitude: number,
  humidity: number,
  windSpeed: number,
  windAngle: number,
  maxRange: number = 1500,
  increment: number = 50
): DopePoint[] {
  const adjustedVelocity = adjustVelocityForAtmosphere(velocity, altitude, temperature, humidity);
  const result = calculateAdvanced(adjustedVelocity, bc, zeroRange, sightHeight, clicksPerMOA, maxRange, increment);
  
  if (windSpeed > 0) {
    return result.map(point => {
      const rangeFeet = point.range * YDS_TO_FT;
      const windage = calculateWindage(windSpeed, windAngle, point.time);
      return { ...point, windage: Math.round(windage * 100) / 100 };
    });
  }
  
  return result;
}

function InputField({ label, value, unit, onChange, placeholder }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

export default function LongRangeScreen() {
  const [velocity, setVelocity] = useState('2800');
  const [bc, setBc] = useState('0.5');
  const [zeroRange, setZeroRange] = useState('100');
  const [sightHeight, setSightHeight] = useState('1.5');
  const [clicksPerMOA, setClicksPerMOA] = useState('0.25');
  const [temperature, setTemperature] = useState('59');
  const [altitude, setAltitude] = useState('0');
  const [humidity, setHumidity] = useState('50');
  const [windSpeed, setWindSpeed] = useState('0');
  const [windAngle, setWindAngle] = useState('90');
  const [results, setResults] = useState<DopePoint[] | null>(null);

  const calculate = () => {
    const v = parseFloat(velocity) || 2800;
    const b = parseFloat(bc) || 0.5;
    const z = parseFloat(zeroRange) || 100;
    const s = parseFloat(sightHeight) || 1.5;
    const c = parseFloat(clicksPerMOA) || 0.25;
    const t = parseFloat(temperature) || 59;
    const a = parseFloat(altitude) || 0;
    const h = parseFloat(humidity) || 50;
    const ws = parseFloat(windSpeed) || 0;
    const wa = parseFloat(windAngle) || 90;
    const result = calculateLongRange(v, b, z, s, c, t, a, h, ws, wa, 1500, 50);
    setResults(result);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Long Range</Text>
        <Text style={styles.sectionDesc}>Environmental factors included</Text>
        <InputField label="Muzzle Velocity" value={velocity} unit="fps" onChange={setVelocity} placeholder="2800" />
        <InputField label="Ballistic Coefficient" value={bc} unit="BC" onChange={setBc} placeholder="0.5" />
        <InputField label="Zero Range" value={zeroRange} unit="yds" onChange={setZeroRange} placeholder="100" />
        <InputField label="Sight Height" value={sightHeight} unit="in" onChange={setSightHeight} placeholder="1.5" />
        <InputField label="Click Size" value={clicksPerMOA} unit="MOA" onChange={setClicksPerMOA} placeholder="0.25" />
        <View style={styles.divider} />
        <Text style={styles.subTitle}>Environment</Text>
        <InputField label="Temperature" value={temperature} unit="°F" onChange={setTemperature} placeholder="59" />
        <InputField label="Altitude" value={altitude} unit="ft" onChange={setAltitude} placeholder="0" />
        <InputField label="Humidity" value={humidity} unit="%" onChange={setHumidity} placeholder="50" />
        <View style={styles.divider} />
        <Text style={styles.subTitle}>Wind</Text>
        <InputField label="Wind Speed" value={windSpeed} unit="mph" onChange={setWindSpeed} placeholder="0" />
        <InputField label="Wind Angle" value={windAngle} unit="°" onChange={setWindAngle} placeholder="90" />
        <TouchableOpacity style={styles.button} onPress={calculate}><Text style={styles.buttonText}>Calculate</Text></TouchableOpacity>
      </View>
      {results && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Results</Text>
          <View style={styles.resultsCard}>
            <View style={styles.resultHeader}><Text style={styles.resultLabel}>Range</Text><Text style={styles.resultLabel}>Hold</Text><Text style={styles.resultLabel}>Wind</Text><Text style={styles.resultLabel}>Clicks</Text></View>
            {results.filter((_, i) => i % 2 === 0).map((point, idx) => (
              <View key={idx} style={styles.resultRow}><Text style={styles.resultValue}>{point.range}y</Text><Text style={[styles.resultValue, point.holdover < 0 && styles.negative]}>{point.holdover > 0 ? '+' : ''}{point.holdover.toFixed(1)}"</Text><Text style={styles.resultValue}>{point.windage}"</Text><Text style={styles.resultValue}>{point.clicks}</Text></View>
            ))}
          </View>
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
  input: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: COLORS.text, fontSize: 16, borderWidth: 1, borderColor: COLORS.surfaceLight },
  unit: { ...TYPOGRAPHY.body, color: COLORS.textMuted, marginLeft: SPACING.sm, width: 40 },
  button: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  buttonText: { ...TYPOGRAPHY.body, color: COLORS.background, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.surfaceLight, marginVertical: SPACING.md },
  subTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.sm },
  resultsCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.surfaceLight },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLight },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLight },
  resultLabel: { ...TYPOGRAPHY.small, color: COLORS.textMuted, flex: 1 },
  resultValue: { ...TYPOGRAPHY.caption, color: COLORS.text, flex: 1 },
  negative: { color: COLORS.secondary },
});