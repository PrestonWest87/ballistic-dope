import {
  CalculationMode,
  DragModel,
  QuickDirtyInputs,
  AdvancedInputs,
  LongRangeInputs,
  ExtremeRangeInputs,
  DopePoint,
  TrajectoryResult,
  DEFAULT_INPUTS,
} from './types';

const G_CONSTANT = 32.174;
const FT_TO_INCHES = 12;
const YDS_TO_FT = 3;
const GRAVITY = 32.174;

function calculateDragCoefficient(velocity: number, bc: number, model: DragModel = DragModel.G1): number {
  const v = velocity;
  if (v < 500) return 0.150;
  if (v < 1000) return 0.180;
  if (v < 1500) return bc * 0.92;
  if (v < 2000) return bc * 0.95;
  if (v < 2500) return bc;
  if (v < 3000) return bc * 1.02;
  if (v < 3500) return bc * 1.08;
  return bc * 1.15;
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

function adjustVelocityForAtmosphere(
  velocity: number,
  altitude: number,
  temperature: number,
  humidity: number
): number {
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

function calculateVelocityAtRange(
  initialVelocity: number,
  rangeFeet: number,
  bc: number
): number {
  const dragFactor = bc * 0.01;
  const decay = Math.exp(-dragFactor * rangeFeet / initialVelocity);
  return initialVelocity * Math.max(decay, 0.3);
}

function calculateEnergy(velocity: number, bulletWeight: number): number {
  return (bulletWeight * velocity * velocity) / 450240;
}

function calculateWindage(
  windSpeed: number,
  windAngle: number,
  time: number
): number {
  const angleRad = (windAngle * Math.PI) / 180;
  const windComponent = windSpeed * Math.sin(angleRad);
  return windComponent * time * FT_TO_INCHES * 0.8;
}

function calculateCoriolis(windSpeed: number, latitude: number, time: number): number {
  const latitudeRad = (latitude * Math.PI) / 180;
  const coriolisFactor = Math.sin(latitudeRad) * 0.0000427;
  return windSpeed * coriolisFactor * time * FT_TO_INCHES;
}

function calculateSpinDrift(twistRate: number, bulletLength: number, time: number): number {
  const spinFactor = (17.6 * bulletLength) / twistRate;
  return spinFactor * time * time * FT_TO_INCHES * 0.5;
}

export function calculateQuickDirty(
  inputs: QuickDirtyInputs,
  maxRange: number = 1000,
  increment: number = 50
): TrajectoryResult {
  const { velocity, ballisticCoefficient, zeroRange } = inputs;
  const zeroFeet = zeroRange * YDS_TO_FT;
  const bulletWeight = 150;

  const dopeChart: DopePoint[] = [];
  let currentRange = 0;

  while (currentRange <= maxRange) {
    const rangeFeet = currentRange * YDS_TO_FT;
    const time = calculateTimeOfFlight(rangeFeet, velocity, ballisticCoefficient);
    const drop = calculateDrop(time);
    const adjustedDrop = drop * (rangeFeet > zeroFeet ? (rangeFeet - zeroFeet) / rangeFeet : 0);
    const holdover = adjustedDrop - ((rangeFeet - zeroFeet) * drop / zeroFeet);
    const currentVelocity = calculateVelocityAtRange(velocity, rangeFeet, ballisticCoefficient);
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

  return {
    mode: CalculationMode.QUICK_DIRTY,
    inputs,
    dopeChart,
    maxRange,
    maxDrop: Math.max(...dopeChart.map(d => d.drop)),
    muzzleEnergy: calculateEnergy(velocity, bulletWeight),
  };
}

export function calculateAdvanced(
  inputs: AdvancedInputs,
  maxRange: number = 1000,
  increment: number = 50
): TrajectoryResult {
  const { velocity, ballisticCoefficient, zeroRange, sightHeight, clicksPerMOA } = inputs;
  const zeroFeet = zeroRange * YDS_TO_FT;
  const bulletWeight = 150;
  const sightHeightInches = sightHeight;

  const dopeChart: DopePoint[] = [];
  let currentRange = 0;

  while (currentRange <= maxRange) {
    const rangeFeet = currentRange * YDS_TO_FT;
    const time = calculateTimeOfFlight(rangeFeet, velocity, ballisticCoefficient);
    let drop = calculateDrop(time);
    
    const heightCorrection = sightHeightInches * (rangeFeet * rangeFeet) / (rangeFeet * rangeFeet + 470000);
    drop = drop - heightCorrection;
    
    const adjustedDrop = rangeFeet <= zeroFeet ? drop * (zeroFeet - rangeFeet) / zeroFeet : drop;
    const holdover = adjustedDrop;
    const currentVelocity = calculateVelocityAtRange(velocity, rangeFeet, ballisticCoefficient);
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

  return {
    mode: CalculationMode.ADVANCED,
    inputs,
    dopeChart,
    maxRange,
    maxDrop: Math.max(...dopeChart.map(d => d.drop)),
    muzzleEnergy: calculateEnergy(velocity, bulletWeight),
  };
}

export function calculateLongRange(
  inputs: LongRangeInputs,
  maxRange: number = 1500,
  increment: number = 50
): TrajectoryResult {
  const adjustedVelocity = adjustVelocityForAtmosphere(
    inputs.velocity,
    inputs.altitude,
    inputs.temperature,
    inputs.humidity
  );

  const inputsWithAdjustedVelocity: AdvancedInputs = {
    velocity: adjustedVelocity,
    ballisticCoefficient: inputs.ballisticCoefficient,
    zeroRange: inputs.zeroRange,
    sightHeight: inputs.sightHeight,
    clicksPerMOA: inputs.clicksPerMOA,
  };

  const result = calculateAdvanced(inputsWithAdjustedVelocity, maxRange, increment);
  
  if (inputs.windSpeed > 0) {
    result.dopeChart = result.dopeChart.map(point => {
      const rangeFeet = point.range * YDS_TO_FT;
      const windage = calculateWindage(inputs.windSpeed, inputs.windAngle, point.time);
      return { ...point, windage: Math.round(windage * 100) / 100 };
    });
    result.inputs = inputs;
  }
  
  result.mode = CalculationMode.LONG_RANGE;
  return result;
}

export function calculateExtremeRange(
  inputs: ExtremeRangeInputs,
  maxRange: number = 2000,
  increment: number = 50
): TrajectoryResult {
  const adjustedVelocity = adjustVelocityForAtmosphere(
    inputs.velocity,
    inputs.altitude,
    inputs.temperature,
    inputs.humidity
  );

  const inputsWithAdjustedVelocity: AdvancedInputs = {
    velocity: adjustedVelocity,
    ballisticCoefficient: inputs.ballisticCoefficient,
    zeroRange: inputs.zeroRange,
    sightHeight: inputs.sightHeight,
    clicksPerMOA: inputs.clicksPerMOA,
  };

  const result = calculateAdvanced(inputsWithAdjustedVelocity, maxRange, increment);
  
  const bulletWeight = 150;
  const estimatedSpread = Math.sqrt(
    Math.pow(result.maxRange / 100, 2) + 
    Math.pow(inputs.coriolis ? 2 : 0, 2) +
    Math.pow(inputs.spinDrift ? 1.5 : 0, 2)
  );

  if (inputs.windSpeed > 0) {
    result.dopeChart = result.dopeChart.map(point => {
      let windage = calculateWindage(inputs.windSpeed, inputs.windAngle, point.time);
      
      if (inputs.coriolis) {
        windage += calculateCoriolis(inputs.windSpeed, inputs.latitude, point.time);
      }
      
      if (inputs.spinDrift) {
        windage += calculateSpinDrift(inputs.twistRate, inputs.bulletLength, point.time);
      }
      
      return { ...point, windage: Math.round(windage * 100) / 100 };
    });
  }
  
  result.mode = CalculationMode.EXTREME_RANGE;
  result.inputs = inputs;
  result.estimatedSpread = Math.round(estimatedSpread * 100) / 100;
  return result;
}

export function calculate(
  mode: CalculationMode,
  inputs: QuickDirtyInputs | AdvancedInputs | LongRangeInputs | ExtremeRangeInputs,
  maxRange?: number,
  increment?: number
): TrajectoryResult {
  const maxR = maxRange ?? (mode === CalculationMode.EXTREME_RANGE ? 2000 : mode === CalculationMode.LONG_RANGE ? 1500 : 1000);
  const inc = increment ?? 50;

  switch (mode) {
    case CalculationMode.QUICK_DIRTY:
      return calculateQuickDirty(inputs as QuickDirtyInputs, maxR, inc);
    case CalculationMode.ADVANCED:
      return calculateAdvanced(inputs as AdvancedInputs, maxR, inc);
    case CalculationMode.LONG_RANGE:
      return calculateLongRange(inputs as LongRangeInputs, maxR, inc);
    case CalculationMode.EXTREME_RANGE:
      return calculateExtremeRange(inputs as ExtremeRangeInputs, maxR, inc);
    default:
      return calculateQuickDirty(inputs as QuickDirtyInputs, maxR, inc);
  }
}

export * from './types';