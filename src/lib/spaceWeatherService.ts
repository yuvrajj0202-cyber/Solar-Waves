import { SpaceWeatherData, SpaceWeatherAlert, AlertSeverity } from '@/types/spaceWeather';

class SpaceWeatherService {
  private currentData: SpaceWeatherData | null = null;
  private history: SpaceWeatherData[] = [];
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private subscribers: ((data: SpaceWeatherData) => void)[] = [];

  constructor() {
    this.generateInitialData();
    this.startUpdates();
  }

  private generateInitialData() {
    this.currentData = this.generateSpaceWeatherData();
    // Generate 24 hours of historical data
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
      this.history.push({
        ...this.generateSpaceWeatherData(timestamp),
        timestamp
      });
    }
  }

  private generateSpaceWeatherData(timestamp?: Date): SpaceWeatherData {
    const now = timestamp || new Date();
    
    // Generate realistic space weather values with some randomness
    const baseKIndex = 2 + Math.random() * 3; // 2-5 typical range
    const solarWindVel = 300 + Math.random() * 400; // 300-700 km/s
    const solarFlux = 70 + Math.random() * 150; // 70-220 sfu
    
    // Generate magnetic field components
    const bt = 2 + Math.random() * 15; // 2-17 nT
    const bz = (Math.random() - 0.5) * bt; // -bt/2 to +bt/2
    const by = (Math.random() - 0.5) * bt;
    const bx = Math.sqrt(Math.max(0, bt * bt - by * by - bz * bz));

    const data: SpaceWeatherData = {
      timestamp: now,
      solarWind: {
        velocity: Math.round(solarWindVel),
        density: Math.round((1 + Math.random() * 20) * 10) / 10, // 1-20 particles/cm³
        temperature: Math.round(50000 + Math.random() * 200000) // 50K-250K
      },
      magneticField: {
        bx: Math.round(bx * 10) / 10,
        by: Math.round(by * 10) / 10,
        bz: Math.round(bz * 10) / 10,
        bt: Math.round(bt * 10) / 10
      },
      geomagneticActivity: {
        kIndex: Math.round(baseKIndex * 10) / 10,
        apIndex: Math.round(Math.pow(2, baseKIndex) * 3),
        dstIndex: Math.round(-20 - baseKIndex * 15 + Math.random() * 10)
      },
      solarActivity: {
        solarFlux: Math.round(solarFlux),
        xrayFlux: this.generateXrayClass(solarFlux),
        protonFlux: Math.round(Math.pow(10, 0.5 + Math.random() * 2))
      },
      alerts: this.generateAlerts(baseKIndex, solarWindVel, bz)
    };

    return data;
  }

  private generateXrayClass(solarFlux: number): string {
    const classes = ['A', 'B', 'C', 'M', 'X'];
    let classIndex = 0;
    
    if (solarFlux > 100) classIndex = 1;
    if (solarFlux > 150) classIndex = 2;
    if (solarFlux > 200) classIndex = 3;
    if (solarFlux > 250) classIndex = 4;
    
    const subClass = Math.floor(Math.random() * 9) + 1;
    return `${classes[classIndex]}${subClass}.${Math.floor(Math.random() * 10)}`;
  }

  private generateAlerts(kIndex: number, solarWind: number, bz: number): SpaceWeatherAlert[] {
    const alerts: SpaceWeatherAlert[] = [];
    const now = new Date();

    // Geomagnetic storm alert
    if (kIndex > 4 || bz < -10) {
      let severity: AlertSeverity = 'minor';
      if (kIndex > 5) severity = 'moderate';
      if (kIndex > 6) severity = 'strong';
      if (kIndex > 7) severity = 'severe';
      if (kIndex > 8) severity = 'extreme';

      alerts.push({
        id: `geo-${now.getTime()}`,
        type: 'geomagnetic',
        severity,
        title: `Geomagnetic Storm ${severity.charAt(0).toUpperCase() + severity.slice(1)}`,
        description: `K-index: ${kIndex.toFixed(1)}. Enhanced geomagnetic activity expected. Satellite operations may be affected.`,
        issued: now,
        expires: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours
        acknowledged: false
      });
    }

    // High-speed solar wind alert
    if (solarWind > 600) {
      alerts.push({
        id: `wind-${now.getTime()}`,
        type: 'solar_radiation',
        severity: solarWind > 800 ? 'strong' : 'moderate',
        title: 'High-Speed Solar Wind',
        description: `Solar wind velocity: ${Math.round(solarWind)} km/s. Increased radiation levels possible.`,
        issued: now,
        expires: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours
        acknowledged: false
      });
    }

    // Radio blackout potential
    if (Math.random() < 0.1) { // 10% chance
      alerts.push({
        id: `radio-${now.getTime()}`,
        type: 'radio_blackout',
        severity: 'minor',
        title: 'Radio Blackout Watch',
        description: 'Increased solar activity may cause HF radio communication disruptions.',
        issued: now,
        expires: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
        acknowledged: false
      });
    }

    return alerts;
  }

  private startUpdates() {
    this.updateInterval = setInterval(() => {
      const newData = this.generateSpaceWeatherData();
      this.currentData = newData;
      this.history.push(newData);
      
      // Keep only last 24 hours of data
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      this.history = this.history.filter(d => d.timestamp.getTime() > cutoff);
      
      // Notify subscribers
      this.subscribers.forEach(callback => callback(newData));
    }, 30000); // Update every 30 seconds
  }

  public getCurrentData(): SpaceWeatherData | null {
    return this.currentData;
  }

  public getHistoricalData(): SpaceWeatherData[] {
    return [...this.history];
  }

  public subscribe(callback: (data: SpaceWeatherData) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  public acknowledgeAlert(alertId: string) {
    if (this.currentData) {
      const alert = this.currentData.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
    }
  }

  public cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.subscribers = [];
  }
}

// Export singleton instance
export const spaceWeatherService = new SpaceWeatherService();
export default spaceWeatherService;