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

function calculateWindage(windSpeed: number, windAngle: number, time: number): number {
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

export function calculateAdvanced(
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

export function calculateLongRange(
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
  let result = calculateAdvanced(adjustedVelocity, bc, zeroRange, sightHeight, clicksPerMOA, maxRange, increment);
  
  if (windSpeed > 0) {
    result = result.map(point => {
      const windage = calculateWindage(windSpeed, windAngle, point.time);
      return { ...point, windage: Math.round(windage * 100) / 100 };
    });
  }
  
  return result;
}

export function calculateExtremeRange(
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
  coriolis: boolean,
  spinDrift: boolean,
  latitude: number,
  bulletLength: number,
  twistRate: number,
  maxRange: number = 2000,
  increment: number = 50
): { dopeChart: DopePoint[]; estimatedSpread: number } {
  const adjustedVelocity = adjustVelocityForAtmosphere(velocity, altitude, temperature, humidity);
  let result = calculateAdvanced(adjustedVelocity, bc, zeroRange, sightHeight, clicksPerMOA, maxRange, increment);
  
  const estimatedSpread = Math.sqrt(
    Math.pow(maxRange / 100, 2) + 
    Math.pow(coriolis ? 2 : 0, 2) +
    Math.pow(spinDrift ? 1.5 : 0, 2)
  );

  if (windSpeed > 0) {
    result = result.map(point => {
      let windage = calculateWindage(windSpeed, windAngle, point.time);
      
      if (coriolis) {
        windage += calculateCoriolis(windSpeed, latitude, point.time);
      }
      
      if (spinDrift) {
        windage += calculateSpinDrift(twistRate, bulletLength, point.time);
      }
      
      return { ...point, windage: Math.round(windage * 100) / 100 };
    });
  }
  
  return { dopeChart: result, estimatedSpread: Math.round(estimatedSpread * 100) / 100 };
}