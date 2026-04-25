import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../packages/theme/src';
import { calculateLongRange, LongRangeInputs, DopePoint } from '../../../packages/core/src';

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
    const inputs: LongRangeInputs = {
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
    };
    const result = calculateLongRange(inputs, 1500, 50);
    setResults(result.dopeChart);
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