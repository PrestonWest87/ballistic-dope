import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../packages/theme/src';
import { calculateExtremeRange, ExtremeRangeInputs, DopePoint } from '../../../packages/core/src';

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

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleGroup}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary }} thumbColor={COLORS.text} />
    </View>
  );
}

export default function ExtremeScreen() {
  const [velocity, setVelocity] = useState('2800');
  const [bc, setBc] = useState('0.5');
  const [zeroRange, setZeroRange] = useState('100');
  const [sightHeight, setSightHeight] = useState('1.5');
  const [clicksPerMOA, setClicksPerMOA] = useState('0.25');
  const [temperature, setTemperature] = useState('59');
  const [altitude, setAltitude] = useState('0');
  const [humidity, setHumidity] = useState('50');
  const [windSpeed, setWindSpeed] = useState('10');
  const [windAngle, setWindAngle] = useState('90');
  const [coriolis, setCoriolis] = useState(true);
  const [spinDrift, setSpinDrift] = useState(true);
  const [latitude, setLatitude] = useState('45');
  const [bulletLength, setBulletLength] = useState('1.2');
  const [twistRate, setTwistRate] = useState('12');
  const [results, setResults] = useState<DopePoint[] | null>(null);
  const [spread, setSpread] = useState<number | null>(null);

  const calculate = () => {
    const inputs: ExtremeRangeInputs = {
      velocity: parseFloat(velocity) || 2800,
      ballisticCoefficient: parseFloat(bc) || 0.5,
      zeroRange: parseFloat(zeroRange) || 100,
      sightHeight: parseFloat(sightHeight) || 1.5,
      clicksPerMOA: parseFloat(clicksPerMOA) || 0.25,
      temperature: parseFloat(temperature) || 59,
      altitude: parseFloat(altitude) || 0,
      humidity: parseFloat(humidity) || 50,
      windSpeed: parseFloat(windSpeed) || 0,
      windAngle: parseFloat(windAngle) || 90,
      coriolis,
      spinDrift,
      latitude: parseFloat(latitude) || 45,
      bulletLength: parseFloat(bulletLength) || 1.2,
      twistRate: parseFloat(twistRate) || 12,
    };
    const result = calculateExtremeRange(inputs, 2000, 50);
    setResults(result.dopeChart);
    setSpread(result.estimatedSpread || null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Extreme Range</Text>
        <Text style={styles.sectionDesc}>Maximum factors + spread estimation</Text>
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
        <InputField label="Wind Speed" value={windSpeed} unit="mph" onChange={setWindSpeed} placeholder="10" />
        <InputField label="Wind Angle" value={windAngle} unit="°" onChange={setWindAngle} placeholder="90" />
        <View style={styles.divider} />
        <Text style={styles.subTitle}>Advanced Effects</Text>
        <ToggleField label="Coriolis Effect" value={coriolis} onChange={setCoriolis} />
        <ToggleField label="Spin Drift" value={spinDrift} onChange={setSpinDrift} />
        <InputField label="Latitude" value={latitude} unit="°" onChange={setLatitude} placeholder="45" />
        <InputField label="Bullet Length" value={bulletLength} unit="in" onChange={setBulletLength} placeholder="1.2" />
        <InputField label="Twist Rate" value={twistRate} unit="in" onChange={setTwistRate} placeholder="12" />
        <TouchableOpacity style={styles.button} onPress={calculate}><Text style={styles.buttonText}>Calculate</Text></TouchableOpacity>
      </View>
      {results && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Results</Text>
          {spread && <View style={styles.spreadBadge}><Text style={styles.spreadLabel}>Est. Spread: </Text><Text style={styles.spreadValue}>±{spread.toFixed(1)}"</Text></View>}
          <View style={styles.resultsCard}>
            <View style={styles.resultHeader}><Text style={styles.resultLabel}>Range</Text><Text style={styles.resultLabel}>Hold</Text><Text style={styles.resultLabel}>Wind</Text><Text style={styles.resultLabel}>Clicks</Text></View>
            {results.filter((_, i) => i % 4 === 0).map((point, idx) => (
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
  toggleGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, paddingVertical: SPACING.sm },
  resultsCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.surfaceLight },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLight },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLight },
  resultLabel: { ...TYPOGRAPHY.small, color: COLORS.textMuted, flex: 1 },
  resultValue: { ...TYPOGRAPHY.caption, color: COLORS.text, flex: 1 },
  negative: { color: COLORS.secondary },
  spreadBadge: { flexDirection: 'row', backgroundColor: COLORS.secondary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  spreadLabel: { ...TYPOGRAPHY.body, color: COLORS.text },
  spreadValue: { ...TYPOGRAPHY.body, color: COLORS.text, fontWeight: '700' },
});