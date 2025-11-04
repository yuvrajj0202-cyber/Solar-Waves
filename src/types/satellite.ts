export interface Satellite {
  id: string;
  name: string;
  type: 'communication' | 'gps' | 'scientific' | 'weather';
  mode: SatelliteMode;
  status: SatelliteStatus;
  position: {
    latitude: number;
    longitude: number;
    altitude: number; // km
  };
  telemetry: {
    batteryLevel: number; // percentage
    signalStrength: number; // dBm
    temperature: number; // Celsius
    powerConsumption: number; // watts
  };
  lastUpdate: Date;
  modeHistory: ModeHistoryEntry[];
}

export type SatelliteMode = 'normal' | 'safe' | 'alert' | 'emergency' | 'maintenance';

export interface SatelliteStatus {
  operational: boolean;
  communicating: boolean;
  instruments: 'active' | 'standby' | 'offline';
  issues: string[];
}

export interface ModeHistoryEntry {
  mode: SatelliteMode;
  timestamp: Date;
  reason: string;
  automatic: boolean;
}

export interface SatelliteFleet {
  satellites: Satellite[];
  lastUpdate: Date;
  totalActive: number;
  totalInSafeMode: number;
  totalWithIssues: number;
}