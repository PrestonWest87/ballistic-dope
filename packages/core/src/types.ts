export enum CalculationMode {
  QUICK_DIRTY = 'quick_dirty',
  ADVANCED = 'advanced',
  LONG_RANGE = 'long_range',
  EXTREME_RANGE = 'extreme_range',
}

export enum DragModel {
  G1 = 'G1',
  G7 = 'G7',
}

export enum UnitSystem {
  IMPERIAL = 'imperial',
  METRIC = 'metric',
}

export enum AdjustmentUnit {
  MOA = 'MOA',
  MIL = 'MIL',
  INCH = 'INCH',
}

export interface QuickDirtyInputs {
  velocity: number;
  ballisticCoefficient: number;
  zeroRange: number;
}

export interface AdvancedInputs extends QuickDirtyInputs {
  sightHeight: number;
  clicksPerMOA: number;
}

export interface LongRangeInputs extends AdvancedInputs {
  temperature: number;
  altitude: number;
  humidity: number;
  windSpeed: number;
  windAngle: number;
}

export interface ExtremeRangeInputs extends LongRangeInputs {
  coriolis: boolean;
  spinDrift: boolean;
  latitude: number;
  bulletLength: number;
  twistRate: number;
}

export type BallisticInputs =
  | QuickDirtyInputs
  | AdvancedInputs
  | LongRangeInputs
  | ExtremeRangeInputs;

export interface DopePoint {
  range: number;
  drop: number;
  holdover: number;
  velocity: number;
  energy: number;
  time: number;
  windage: number;
  clicks: number;
}

export interface TrajectoryResult {
  mode: CalculationMode;
  inputs: BallisticInputs;
  dopeChart: DopePoint[];
  maxRange: number;
  maxDrop: number;
  muzzleEnergy: number;
  estimatedSpread?: number;
}

export const DEFAULT_INPUTS: QuickDirtyInputs = {
  velocity: 2800,
  ballisticCoefficient: 0.5,
  zeroRange: 100,
};

export const DEFAULT_ADVANCED_INPUTS: AdvancedInputs = {
  ...DEFAULT_INPUTS,
  sightHeight: 1.5,
  clicksPerMOA: 0.25,
};

export const DEFAULT_LONG_RANGE_INPUTS: LongRangeInputs = {
  ...DEFAULT_ADVANCED_INPUTS,
  temperature: 59,
  altitude: 0,
  humidity: 50,
  windSpeed: 0,
  windAngle: 90,
};

export const DEFAULT_EXTREME_RANGE_INPUTS: ExtremeRangeInputs = {
  ...DEFAULT_LONG_RANGE_INPUTS,
  coriolis: false,
  spinDrift: false,
  latitude: 45,
  bulletLength: 1.2,
  twistRate: 12,
};