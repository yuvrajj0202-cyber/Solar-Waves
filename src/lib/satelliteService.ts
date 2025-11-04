import { Satellite, SatelliteFleet, SatelliteMode, ModeHistoryEntry } from '@/types/satellite';
import { SpaceWeatherData } from '@/types/spaceWeather';

class SatelliteService {
  private fleet: SatelliteFleet;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private subscribers: ((fleet: SatelliteFleet) => void)[] = [];

  constructor() {
    this.fleet = this.generateInitialFleet();
    this.startUpdates();
  }

  private generateInitialFleet(): SatelliteFleet {
    const satellites: Satellite[] = [
      {
        id: 'comm-sat-1',
        name: 'CommSat Alpha',
        type: 'communication',
        mode: 'normal',
        status: {
          operational: true,
          communicating: true,
          instruments: 'active',
          issues: []
        },
        position: {
          latitude: 0.0,
          longitude: -75.0,
          altitude: 35786
        },
        telemetry: {
          batteryLevel: 87,
          signalStrength: -65,
          temperature: 15,
          powerConsumption: 850
        },
        lastUpdate: new Date(),
        modeHistory: []
      },
      {
        id: 'gps-sat-2',
        name: 'NavStar Beta',
        type: 'gps',
        mode: 'normal',
        status: {
          operational: true,
          communicating: true,
          instruments: 'active',
          issues: []
        },
        position: {
          latitude: 55.0,
          longitude: 12.0,
          altitude: 20200
        },
        telemetry: {
          batteryLevel: 92,
          signalStrength: -58,
          temperature: -5,
          powerConsumption: 1200
        },
        lastUpdate: new Date(),
        modeHistory: []
      },
      {
        id: 'sci-sat-3',
        name: 'Research Gamma',
        type: 'scientific',
        mode: 'normal',
        status: {
          operational: true,
          communicating: true,
          instruments: 'active',
          issues: []
        },
        position: {
          latitude: -25.0,
          longitude: 140.0,
          altitude: 600
        },
        telemetry: {
          batteryLevel: 78,
          signalStrength: -72,
          temperature: -45,
          powerConsumption: 450
        },
        lastUpdate: new Date(),
        modeHistory: []
      },
      {
        id: 'weather-sat-4',
        name: 'MeteoSat Delta',
        type: 'weather',
        mode: 'normal',
        status: {
          operational: true,
          communicating: true,
          instruments: 'active',
          issues: []
        },
        position: {
          latitude: 0.0,
          longitude: 0.0,
          altitude: 35786
        },
        telemetry: {
          batteryLevel: 95,
          signalStrength: -61,
          temperature: 8,
          powerConsumption: 950
        },
        lastUpdate: new Date(),
        modeHistory: []
      }
    ];

    return {
      satellites,
      lastUpdate: new Date(),
      totalActive: satellites.filter(s => s.status.operational).length,
      totalInSafeMode: satellites.filter(s => s.mode === 'safe').length,
      totalWithIssues: satellites.filter(s => s.status.issues.length > 0).length
    };
  }

  private updateSatelliteData() {
    const now = new Date();
    
    this.fleet.satellites.forEach(satellite => {
      // Update telemetry with small random variations
      satellite.telemetry.batteryLevel = Math.max(10, 
        satellite.telemetry.batteryLevel + (Math.random() - 0.5) * 2);
      satellite.telemetry.signalStrength = satellite.telemetry.signalStrength + (Math.random() - 0.5) * 3;
      satellite.telemetry.temperature = satellite.telemetry.temperature + (Math.random() - 0.5) * 4;
      
      // Adjust power consumption based on mode
      const basePower = satellite.type === 'communication' ? 850 : 
                       satellite.type === 'gps' ? 1200 :
                       satellite.type === 'weather' ? 950 : 450;
      
      const modeMultiplier = satellite.mode === 'safe' ? 0.3 :
                            satellite.mode === 'alert' ? 1.2 :
                            satellite.mode === 'emergency' ? 0.2 :
                            satellite.mode === 'maintenance' ? 0.1 : 1.0;
      
      satellite.telemetry.powerConsumption = Math.round(basePower * modeMultiplier);
      
      // Update orbital position (simplified)
      if (satellite.type === 'gps' || satellite.type === 'scientific') {
        satellite.position.longitude += 0.1; // LEO satellites move faster
        if (satellite.position.longitude > 180) satellite.position.longitude -= 360;
      } else {
        satellite.position.longitude += 0.01; // GEO satellites move slower
        if (satellite.position.longitude > 180) satellite.position.longitude -= 360;
      }
      
      satellite.lastUpdate = now;
    });

    // Update fleet statistics
    this.fleet.totalActive = this.fleet.satellites.filter(s => s.status.operational).length;
    this.fleet.totalInSafeMode = this.fleet.satellites.filter(s => s.mode === 'safe').length;
    this.fleet.totalWithIssues = this.fleet.satellites.filter(s => s.status.issues.length > 0).length;
    this.fleet.lastUpdate = now;

    // Notify subscribers
    this.subscribers.forEach(callback => callback({ ...this.fleet }));
  }

  private startUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateSatelliteData();
    }, 30000); // Update every 30 seconds
  }

  public getFleet(): SatelliteFleet {
    return { ...this.fleet };
  }

  public getSatellite(id: string): Satellite | null {
    const satellite = this.fleet.satellites.find(s => s.id === id);
    return satellite ? { ...satellite } : null;
  }

  public setSatelliteMode(satelliteId: string, mode: SatelliteMode, reason?: string) {
    const satellite = this.fleet.satellites.find(s => s.id === satelliteId);
    if (!satellite) return false;

    const oldMode = satellite.mode;
    satellite.mode = mode;
    
    // Add to mode history
    const historyEntry: ModeHistoryEntry = {
      mode,
      timestamp: new Date(),
      reason: reason || `Manual mode change from ${oldMode} to ${mode}`,
      automatic: false
    };
    satellite.modeHistory.unshift(historyEntry);
    
    // Keep only last 10 history entries
    if (satellite.modeHistory.length > 10) {
      satellite.modeHistory = satellite.modeHistory.slice(0, 10);
    }

    // Update satellite status based on mode
    this.updateSatelliteStatus(satellite);
    
    // Update fleet statistics
    this.updateFleetStats();
    
    // Notify subscribers
    this.subscribers.forEach(callback => callback({ ...this.fleet }));
    
    return true;
  }

  public setFleetToSafeMode(reason: string = 'Emergency protocol activated') {
    let changed = 0;
    
    this.fleet.satellites.forEach(satellite => {
      if (satellite.mode !== 'safe' && satellite.mode !== 'maintenance') {
        const oldMode = satellite.mode;
        satellite.mode = 'safe';
        
        const historyEntry: ModeHistoryEntry = {
          mode: 'safe',
          timestamp: new Date(),
          reason: `Fleet emergency: ${reason} (was ${oldMode})`,
          automatic: true
        };
        satellite.modeHistory.unshift(historyEntry);
        
        if (satellite.modeHistory.length > 10) {
          satellite.modeHistory = satellite.modeHistory.slice(0, 10);
        }
        
        this.updateSatelliteStatus(satellite);
        changed++;
      }
    });

    if (changed > 0) {
      this.updateFleetStats();
      this.subscribers.forEach(callback => callback({ ...this.fleet }));
    }
    
    return changed;
  }

  public respondToSpaceWeather(spaceWeatherData: SpaceWeatherData) {
    let changedSatellites = 0;
    const now = new Date();
    
    this.fleet.satellites.forEach(satellite => {
      let shouldGoToSafeMode = false;
      let reason = '';

      // Check for severe space weather conditions
      if (spaceWeatherData.geomagneticActivity.kIndex > 6) {
        shouldGoToSafeMode = true;
        reason = `Severe geomagnetic storm (K=${spaceWeatherData.geomagneticActivity.kIndex.toFixed(1)})`;
      } else if (spaceWeatherData.solarWind.velocity > 700) {
        shouldGoToSafeMode = true;
        reason = `High-speed solar wind (${spaceWeatherData.solarWind.velocity} km/s)`;
      } else if (spaceWeatherData.magneticField.bz < -15) {
        shouldGoToSafeMode = true;
        reason = `Strong southward magnetic field (Bz=${spaceWeatherData.magneticField.bz.toFixed(1)} nT)`;
      }

      // Only change mode if satellite is in normal or alert mode and conditions warrant safe mode
      if (shouldGoToSafeMode && (satellite.mode === 'normal' || satellite.mode === 'alert')) {
        const oldMode = satellite.mode;
        satellite.mode = 'safe';
        
        const historyEntry: ModeHistoryEntry = {
          mode: 'safe',
          timestamp: now,
          reason: `Automatic response: ${reason} (was ${oldMode})`,
          automatic: true
        };
        satellite.modeHistory.unshift(historyEntry);
        
        if (satellite.modeHistory.length > 10) {
          satellite.modeHistory = satellite.modeHistory.slice(0, 10);
        }
        
        this.updateSatelliteStatus(satellite);
        changedSatellites++;
      }
      
      // Return to normal mode if conditions improve and satellite is in safe mode
      else if (!shouldGoToSafeMode && satellite.mode === 'safe' && 
               spaceWeatherData.geomagneticActivity.kIndex < 4 &&
               spaceWeatherData.solarWind.velocity < 500) {
        satellite.mode = 'normal';
        
        const historyEntry: ModeHistoryEntry = {
          mode: 'normal',
          timestamp: now,
          reason: 'Automatic return to normal: Space weather conditions improved',
          automatic: true
        };
        satellite.modeHistory.unshift(historyEntry);
        
        if (satellite.modeHistory.length > 10) {
          satellite.modeHistory = satellite.modeHistory.slice(0, 10);
        }
        
        this.updateSatelliteStatus(satellite);
        changedSatellites++;
      }
    });

    if (changedSatellites > 0) {
      this.updateFleetStats();
      this.subscribers.forEach(callback => callback({ ...this.fleet }));
    }
  }

  private updateSatelliteStatus(satellite: Satellite) {
    // Reset issues
    satellite.status.issues = [];
    
    // Update status based on mode
    switch (satellite.mode) {
      case 'safe':
        satellite.status.instruments = 'standby';
        satellite.status.communicating = true;
        satellite.status.operational = true;
        break;
      case 'emergency':
        satellite.status.instruments = 'offline';
        satellite.status.communicating = false;
        satellite.status.operational = false;
        satellite.status.issues.push('Emergency mode active');
        break;
      case 'maintenance':
        satellite.status.instruments = 'offline';
        satellite.status.communicating = true;
        satellite.status.operational = false;
        satellite.status.issues.push('Scheduled maintenance');
        break;
      case 'alert':
        satellite.status.instruments = 'active';
        satellite.status.communicating = true;
        satellite.status.operational = true;
        satellite.status.issues.push('Heightened alert status');
        break;
      default: // normal
        satellite.status.instruments = 'active';
        satellite.status.communicating = true;
        satellite.status.operational = true;
        break;
    }
    
    // Add battery warning if low
    if (satellite.telemetry.batteryLevel < 20) {
      satellite.status.issues.push('Low battery warning');
    }
    
    satellite.lastUpdate = new Date();
  }

  private updateFleetStats() {
    this.fleet.totalActive = this.fleet.satellites.filter(s => s.status.operational).length;
    this.fleet.totalInSafeMode = this.fleet.satellites.filter(s => s.mode === 'safe').length;
    this.fleet.totalWithIssues = this.fleet.satellites.filter(s => s.status.issues.length > 0).length;
    this.fleet.lastUpdate = new Date();
  }

  public subscribe(callback: (fleet: SatelliteFleet) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
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
export const satelliteService = new SatelliteService();
export default satelliteService;