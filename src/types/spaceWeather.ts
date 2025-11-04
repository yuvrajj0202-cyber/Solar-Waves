export interface SpaceWeatherData {
  timestamp: Date;
  solarWind: {
    velocity: number; // km/s
    density: number; // particles/cm³
    temperature: number; // K
  };
  magneticField: {
    bx: number; // nT
    by: number; // nT
    bz: number; // nT
    bt: number; // nT total
  };
  geomagneticActivity: {
    kIndex: number; // 0-9
    apIndex: number; // nT
    dstIndex: number; // nT
  };
  solarActivity: {
    solarFlux: number; // sfu
    xrayFlux: string; // A, B, C, M, X class
    protonFlux: number; // particles/cm²/s
  };
  alerts: SpaceWeatherAlert[];
}

export interface SpaceWeatherAlert {
  id: string;
  type: 'geomagnetic' | 'solar_radiation' | 'radio_blackout';
  severity: 'minor' | 'moderate' | 'strong' | 'severe' | 'extreme';
  title: string;
  description: string;
  issued: Date;
  expires: Date;
  acknowledged: boolean;
}

export type AlertSeverity = 'minor' | 'moderate' | 'strong' | 'severe' | 'extreme';

export interface HistoricalDataPoint {
  timestamp: Date;
  value: number;
  metric: string;
}