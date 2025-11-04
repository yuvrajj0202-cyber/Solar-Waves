import { SpaceWeatherData } from '@/types/spaceWeather';
import { SatelliteFleet } from '@/types/satellite';

export interface ShareableReport {
  id: string;
  type: 'full' | 'weather-only' | 'satellites-only' | 'alerts-only';
  data: {
    spaceWeather?: SpaceWeatherData;
    satellites?: SatelliteFleet;
    timestamp: Date;
    validUntil: Date;
  };
  metadata: {
    generated: Date;
    format: string;
    includeHistory: boolean;
    includeCharts: boolean;
    includeAlerts: boolean;
  };
}

class ShareService {
  private reports: Map<string, ShareableReport> = new Map();

  generateShareableReport(
    spaceWeatherData: SpaceWeatherData,
    satelliteFleet: SatelliteFleet,
    options: {
      type: 'full' | 'weather-only' | 'satellites-only' | 'alerts-only';
      format: string;
      includeHistory: boolean;
      includeCharts: boolean;
      includeAlerts: boolean;
    }
  ): string {
    const shareId = this.generateUniqueId();
    const now = new Date();
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const report: ShareableReport = {
      id: shareId,
      type: options.type,
      data: {
        spaceWeather: options.type !== 'satellites-only' ? spaceWeatherData : undefined,
        satellites: options.type !== 'weather-only' ? satelliteFleet : undefined,
        timestamp: now,
        validUntil
      },
      metadata: {
        generated: now,
        format: options.format,
        includeHistory: options.includeHistory,
        includeCharts: options.includeCharts,
        includeAlerts: options.includeAlerts
      }
    };

    this.reports.set(shareId, report);
    
    // Clean up expired reports
    this.cleanupExpiredReports();
    
    return shareId;
  }

  getSharedReport(shareId: string): ShareableReport | null {
    const report = this.reports.get(shareId);
    
    if (!report) {
      return null;
    }
    
    // Check if report is still valid
    if (new Date() > report.data.validUntil) {
      this.reports.delete(shareId);
      return null;
    }
    
    return report;
  }

  generateShareURL(shareId: string, baseUrl?: string): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/shared-report/${shareId}`;
  }

  exportToFormat(report: ShareableReport, format: string): string {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'csv':
        return this.generateCSV(report);
      
      case 'xml':
        return this.generateXML(report);
      
      case 'txt':
        return this.generateTextReport(report);
      
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  private generateCSV(report: ShareableReport): string {
    const lines = ['Type,Metric,Value,Unit,Timestamp'];
    
    if (report.data.spaceWeather) {
      const sw = report.data.spaceWeather;
      lines.push(`Space Weather,K-Index,${sw.geomagneticActivity.kIndex},,${sw.timestamp.toISOString()}`);
      lines.push(`Space Weather,Solar Wind Velocity,${sw.solarWind.velocity},km/s,${sw.timestamp.toISOString()}`);
      lines.push(`Space Weather,Magnetic Field Bt,${sw.magneticField.bt},nT,${sw.timestamp.toISOString()}`);
      lines.push(`Space Weather,Solar Flux,${sw.solarActivity.solarFlux},sfu,${sw.timestamp.toISOString()}`);
    }
    
    if (report.data.satellites) {
      const fleet = report.data.satellites;
      lines.push(`Satellites,Total Count,${fleet.satellites.length},,${fleet.lastUpdate.toISOString()}`);
      lines.push(`Satellites,Operational,${fleet.totalActive},,${fleet.lastUpdate.toISOString()}`);
      lines.push(`Satellites,Safe Mode,${fleet.totalInSafeMode},,${fleet.lastUpdate.toISOString()}`);
      lines.push(`Satellites,With Issues,${fleet.totalWithIssues},,${fleet.lastUpdate.toISOString()}`);
      
      fleet.satellites.forEach(sat => {
        lines.push(`Satellite,${sat.name} Mode,${sat.mode},,${sat.lastUpdate.toISOString()}`);
        lines.push(`Satellite,${sat.name} Battery,${sat.telemetry.batteryLevel},%,${sat.lastUpdate.toISOString()}`);
      });
    }
    
    return lines.join('\n');
  }

  private generateXML(report: ShareableReport): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<SpaceWeatherReport>\n';
    xml += `  <metadata generated="${report.metadata.generated.toISOString()}" type="${report.type}"/>\n`;
    
    if (report.data.spaceWeather) {
      const sw = report.data.spaceWeather;
      xml += '  <spaceWeather>\n';
      xml += `    <kIndex>${sw.geomagneticActivity.kIndex}</kIndex>\n`;
      xml += `    <solarWindVelocity unit="km/s">${sw.solarWind.velocity}</solarWindVelocity>\n`;
      xml += `    <magneticField unit="nT">${sw.magneticField.bt}</magneticField>\n`;
      xml += `    <solarFlux unit="sfu">${sw.solarActivity.solarFlux}</solarFlux>\n`;
      xml += '  </spaceWeather>\n';
    }
    
    if (report.data.satellites) {
      const fleet = report.data.satellites;
      xml += '  <satellites>\n';
      xml += `    <summary total="${fleet.satellites.length}" operational="${fleet.totalActive}"/>\n`;
      fleet.satellites.forEach(sat => {
        xml += `    <satellite name="${sat.name}" type="${sat.type}" mode="${sat.mode}" battery="${sat.telemetry.batteryLevel}"/>\n`;
      });
      xml += '  </satellites>\n';
    }
    
    xml += '</SpaceWeatherReport>';
    return xml;
  }

  private generateTextReport(report: ShareableReport): string {
    let text = '🛰️  SPACE WEATHER CONTROL CENTER REPORT\n';
    text += '═'.repeat(50) + '\n\n';
    text += `Generated: ${report.metadata.generated.toLocaleString()}\n`;
    text += `Report Type: ${report.type.replace('-', ' ').toUpperCase()}\n`;
    text += `Valid Until: ${report.data.validUntil.toLocaleString()}\n\n`;
    
    if (report.data.spaceWeather) {
      const sw = report.data.spaceWeather;
      text += '🌤️  SPACE WEATHER CONDITIONS\n';
      text += '─'.repeat(30) + '\n';
      text += `K-Index: ${sw.geomagneticActivity.kIndex} (${this.getKIndexDescription(sw.geomagneticActivity.kIndex)})\n`;
      text += `Solar Wind: ${sw.solarWind.velocity} km/s\n`;
      text += `Magnetic Field: ${sw.magneticField.bt} nT (Bz: ${sw.magneticField.bz} nT)\n`;
      text += `Solar Flux: ${sw.solarActivity.solarFlux} sfu\n`;
      text += `X-ray Class: ${sw.solarActivity.xrayFlux}\n\n`;
      
      if (sw.alerts.length > 0) {
        text += '🚨  ACTIVE ALERTS\n';
        text += '─'.repeat(15) + '\n';
        sw.alerts.forEach(alert => {
          text += `• ${alert.title} (${alert.severity.toUpperCase()})\n`;
          text += `  ${alert.description}\n`;
        });
        text += '\n';
      }
    }
    
    if (report.data.satellites) {
      const fleet = report.data.satellites;
      text += '🛰️  SATELLITE FLEET STATUS\n';
      text += '─'.repeat(25) + '\n';
      text += `Total Satellites: ${fleet.satellites.length}\n`;
      text += `Operational: ${fleet.totalActive}\n`;
      text += `Safe Mode: ${fleet.totalInSafeMode}\n`;
      text += `With Issues: ${fleet.totalWithIssues}\n\n`;
      
      text += 'INDIVIDUAL SATELLITES:\n';
      fleet.satellites.forEach(sat => {
        text += `• ${sat.name} (${sat.type.toUpperCase()})\n`;
        text += `  Mode: ${sat.mode.toUpperCase()}\n`;
        text += `  Battery: ${Math.round(sat.telemetry.batteryLevel)}%\n`;
        text += `  Status: ${sat.status.operational ? 'OPERATIONAL' : 'OFFLINE'}\n`;
        if (sat.status.issues.length > 0) {
          text += `  Issues: ${sat.status.issues.join(', ')}\n`;
        }
        text += '\n';
      });
    }
    
    text += '═'.repeat(50) + '\n';
    text += 'End of Report - Space Weather Control Center\n';
    
    return text;
  }

  private getKIndexDescription(kIndex: number): string {
    if (kIndex >= 8) return 'Severe Storm';
    if (kIndex >= 6) return 'Strong Storm';
    if (kIndex >= 4) return 'Minor Storm';
    return 'Quiet Conditions';
  }

  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  }

  private cleanupExpiredReports(): void {
    const now = new Date();
    for (const [id, report] of this.reports.entries()) {
      if (now > report.data.validUntil) {
        this.reports.delete(id);
      }
    }
  }

  // Advanced sharing methods
  async shareViaQRCode(shareId: string): Promise<string> {
    // In a real implementation, this would generate a QR code
    const shareUrl = this.generateShareURL(shareId);
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="Arial">
          QR Code for: ${shareId}
        </text>
      </svg>
    `)}`;
  }

  async shareViaAPI(shareId: string, destination: 'slack' | 'teams' | 'email', options: any): Promise<boolean> {
    // Simulate API integration for sharing to external platforms
    const report = this.getSharedReport(shareId);
    if (!report) return false;

    const shareUrl = this.generateShareURL(shareId);
    
    switch (destination) {
      case 'slack':
        return this.sendToSlack(shareUrl, options);
      case 'teams':
        return this.sendToTeams(shareUrl, options);
      case 'email':
        return this.sendEmail(shareUrl, options.email);
    }
    
    return true;
  }

  private async sendToSlack(shareUrl: string, options: any): Promise<boolean> {
    console.log(`Sharing to Slack: ${shareUrl}`, options);
    return true;
  }

  private async sendToTeams(shareUrl: string, options: any): Promise<boolean> {
    console.log(`Sharing to Teams: ${shareUrl}`, options);
    return true;
  }

  private async sendEmail(shareUrl: string, email: string): Promise<boolean> {
    console.log(`Sending email to ${email}: ${shareUrl}`);
    return true;
  }

  getReportStats(): { totalReports: number; activeReports: number; expiredReports: number } {
    const now = new Date();
    let active = 0;
    let expired = 0;
    
    for (const report of this.reports.values()) {
      if (now > report.data.validUntil) {
        expired++;
      } else {
        active++;
      }
    }
    
    return {
      totalReports: this.reports.size,
      activeReports: active,
      expiredReports: expired
    };
  }
}

// Export singleton instance
export const shareService = new ShareService();
export default shareService;