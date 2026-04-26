import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../packages/theme/src';
import { DopePoint } from '../packages/core/src';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const CHART_HEIGHT = 220;

type GraphType = 'trajectory' | 'velocity' | 'energy' | 'windage';

export default function GraphScreen() {
  const { data } = useLocalSearchParams();
  const points: DopePoint[] = data ? JSON.parse(data as string) : [];
  const [graphType, setGraphType] = useState<GraphType>('trajectory');

  const renderChart = () => {
    if (points.length === 0) return null;

    const maxRange = Math.max(...points.map(p => p.range));
    const xScale = CHART_WIDTH / maxRange;

    let yValues: number[];
    let yLabel: string;
    let color: string;

    switch (graphType) {
      case 'velocity':
        yValues = points.map(p => p.velocity);
        yLabel = 'Velocity (fps)';
        color = COLORS.velocity;
        break;
      case 'energy':
        yValues = points.map(p => p.energy);
        yLabel = 'Energy (ft-lbs)';
        color = COLORS.energy;
        break;
      case 'windage':
        yValues = points.map(p => p.windage);
        yLabel = 'Windage (")';
        color = COLORS.wind;
        break;
      default:
        yValues = points.map(p => p.holdover);
        yLabel = 'Holdover (")';
        color = COLORS.trajectory;
    }

    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const yRange = maxY - minY || 1;
    const yScale = (CHART_HEIGHT - 40) / yRange;

    const pathData = points
      .map((p, i) => {
        const x = (p.range * xScale);
        const y = CHART_HEIGHT - 20 - ((yValues[i] - minY) * yScale);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Line x1={0} y1={CHART_HEIGHT - 20} x2={CHART_WIDTH} y2={CHART_HEIGHT - 20} stroke={COLORS.grid} strokeWidth={1} />
        <Line x1={0} y1={0} x2={0} y2={CHART_HEIGHT - 20} stroke={COLORS.grid} strokeWidth={1} />
        <Path d={pathData} fill="none" stroke={color} strokeWidth={2} />
        {points.filter((_, i) => i % 4 === 0).map((p, i) => (
          <Circle
            key={i}
            cx={p.range * xScale}
            cy={CHART_HEIGHT - 20 - ((yValues[i * 4 || 0] - minY) * yScale)}
            r={4}
            fill={color}
          />
        ))}
        <SvgText x={CHART_WIDTH / 2} y={CHART_HEIGHT - 5} fontSize={10} fill={COLORS.textMuted}>Range (yards)</SvgText>
      </Svg>
    );
  };

  const types: { key: GraphType; label: string }[] = [
    { key: 'trajectory', label: 'Trajectory' },
    { key: 'velocity', label: 'Velocity' },
    { key: 'energy', label: 'Energy' },
    { key: 'windage', label: 'Windage' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tabs}>
        {types.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, graphType === t.key && styles.tabActive]}
            onPress={() => setGraphType(t.key)}
          >
            <Text style={[styles.tabText, graphType === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.chartContainer}>{renderChart()}</View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.trajectory }]} /><Text style={styles.legendText}>Drop/Hold</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.velocity }]} /><Text style={styles.legendText}>Velocity</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.energy }]} /><Text style={styles.legendText}>Energy</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.wind }]} /><Text style={styles.legendText}>Windage</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: 4, marginBottom: SPACING.md },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.sm },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  tabTextActive: { ...TYPOGRAPHY.caption, color: COLORS.background, fontWeight: '600' },
  chartContainer: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.md, gap: SPACING.md },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.xs },
  legendText: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
});