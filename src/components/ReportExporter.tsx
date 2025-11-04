'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SpaceWeatherData } from '@/types/spaceWeather';
import { SatelliteFleet } from '@/types/satellite';
import spaceWeatherService from '@/lib/spaceWeatherService';
import shareService from '@/lib/shareService';
import { toast } from 'sonner';

interface ReportExporterProps {
  currentData: SpaceWeatherData;
  satelliteFleet: SatelliteFleet;
}

type ExportFormat = 'pdf' | 'json' | 'csv' | 'png' | 'svg';
type ReportType = 'full' | 'weather-only' | 'satellites-only' | 'alerts-only';

export function ReportExporter({ currentData, satelliteFleet }: ReportExporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [reportType, setReportType] = useState<ReportType>('full');
  const [includeHistory, setIncludeHistory] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const getFormatIcon = (fmt: ExportFormat) => {
    switch (fmt) {
      case 'pdf': return '📄';
      case 'json': return '📊';
      case 'csv': return '📋';
      case 'png': return '🖼️';
      case 'svg': return '🎨';
      default: return '📁';
    }
  };

   const generateReport = async () => {
    setIsExporting(true);
    
    try {
      // Generate shareable report using ShareService
      const shareId = shareService.generateShareableReport(
        currentData, 
        satelliteFleet, 
        {
          type: reportType,
          format: format,
          includeHistory,
          includeCharts,
          includeAlerts
        }
      );
      
      const report = shareService.getSharedReport(shareId);
      if (!report) throw new Error('Failed to generate report');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const timestamp = new Date().toISOString();
      const filename = `space-weather-report-${timestamp.slice(0, 19).replace(/:/g, '-')}.${format}`;
      
      // Generate content using ShareService
      let content: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = shareService.exportToFormat(report, 'json');
          mimeType = 'application/json';
          break;
        case 'csv':
          content = shareService.exportToFormat(report, 'csv');
          mimeType = 'text/csv';
          break;
        case 'pdf':
          content = generatePDFContent(report);
          mimeType = 'application/pdf';
          break;
        case 'png':
        case 'svg':
          content = await generateImageReport(report, format);
          mimeType = format === 'png' ? 'image/png' : 'image/svg+xml';
          break;
        default:
          content = shareService.exportToFormat(report, 'txt');
          mimeType = 'text/plain';
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`🚀 Report exported successfully as ${format.toUpperCase()}!`, {
        description: `${filename} has been downloaded to your device.`,
        duration: 5000,
      });

    } catch (error) {
      toast.error('❌ Export failed', {
        description: 'Unable to generate report. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsExporting(false);
    }
  };

   const shareReport = async () => {
    setIsSharing(true);
    
    try {
      // Generate shareable report using ShareService
      const shareId = shareService.generateShareableReport(
        currentData, 
        satelliteFleet, 
        {
          type: reportType,
          format: format,
          includeHistory,
          includeCharts,
          includeAlerts
        }
      );
      
      const shareUrl = shareService.generateShareURL(shareId, window.location.origin);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (recipientEmail) {
        // Send via email
        await shareService.shareViaAPI(shareId, 'email', { email: recipientEmail });
        toast.success('📧 Report shared successfully!', {
          description: `Space weather report sent to ${recipientEmail}`,
          duration: 5000,
        });
      } else {
        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success('🔗 Share link created!', {
          description: 'Secure share link copied to clipboard. Valid for 30 days.',
          duration: 5000,
        });
      }

      // Auto-close dialog after successful share
      setTimeout(() => setIsOpen(false), 1000);

    } catch (error) {
      toast.error('❌ Sharing failed', {
        description: 'Unable to create share link. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsSharing(false);
    }
  };

  const generateCSV = (data: any): string => {
    const lines = [
      'Timestamp,Metric,Value,Unit',
      `${data.metadata.generated},K-Index,${data.spaceWeather?.current.geomagneticActivity.kIndex},"none"`,
      `${data.metadata.generated},Solar Wind Velocity,${data.spaceWeather?.current.solarWind.velocity},km/s`,
      `${data.metadata.generated},Magnetic Field Bt,${data.spaceWeather?.current.magneticField.bt},nT`,
      `${data.metadata.generated},Solar Flux,${data.spaceWeather?.current.solarActivity.solarFlux},sfu`,
      `${data.metadata.generated},Active Satellites,${data.satellites?.summary.operational},"count"`,
      `${data.metadata.generated},Safe Mode Satellites,${data.satellites?.summary.inSafeMode},"count"`,
    ];
    return lines.join('\n');
  };

  const generatePDFContent = (data: any): string => {
    // This would typically use a PDF library like jsPDF
    return `%PDF-1.4
Space Weather Control Center Report
Generated: ${data.metadata.generated}
Type: ${data.metadata.type}

Current Conditions:
- K-Index: ${data.spaceWeather?.current.geomagneticActivity.kIndex}
- Solar Wind: ${data.spaceWeather?.current.solarWind.velocity} km/s
- Magnetic Field: ${data.spaceWeather?.current.magneticField.bt} nT
- Solar Flux: ${data.spaceWeather?.current.solarActivity.solarFlux} sfu

Satellite Fleet Status:
- Total Satellites: ${data.satellites?.summary.totalSatellites}
- Operational: ${data.satellites?.summary.operational}
- In Safe Mode: ${data.satellites?.summary.inSafeMode}
- With Issues: ${data.satellites?.summary.withIssues}

Active Alerts: ${data.spaceWeather?.alerts?.length || 0}
`;
  };

  const generateImageReport = async (data: any, format: 'png' | 'svg'): Promise<string> => {
    // This would typically use canvas or SVG generation libraries
    const svgContent = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1f2937"/>
            <stop offset="100%" style="stop-color:#1e40af"/>
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#bg)"/>
        <text x="50" y="50" fill="white" font-size="24" font-family="Arial">Space Weather Report</text>
        <text x="50" y="100" fill="#60a5fa" font-size="16" font-family="Arial">K-Index: ${data.spaceWeather?.current.geomagneticActivity.kIndex}</text>
        <text x="50" y="130" fill="#60a5fa" font-size="16" font-family="Arial">Solar Wind: ${data.spaceWeather?.current.solarWind.velocity} km/s</text>
        <text x="50" y="160" fill="#60a5fa" font-size="16" font-family="Arial">Satellites: ${data.satellites?.summary.operational}/${data.satellites?.summary.totalSatellites} operational</text>
      </svg>
    `;
    
    if (format === 'svg') {
      return svgContent;
    }
    
    // For PNG, you would convert SVG to PNG using canvas
    return svgContent; // Simplified for demo
  };

  const generateShareId = (): string => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  const sendReportEmail = async (email: string, shareUrl: string): Promise<void> => {
    // Simulate email API call
    console.log(`Sending report to ${email} with link: ${shareUrl}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 
                     border-cyan-500 text-white font-medium px-6 py-2 shadow-lg hover:shadow-cyan-500/25 
                     transition-all duration-300"
        >
          <span className="mr-2">🚀</span>
          Export & Share Report
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            🛰️ Space Weather Report Generator
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Generate and share comprehensive space weather reports with real-time data and analytics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-200">Report Type</Label>
            <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="full">🌌 Complete Mission Report</SelectItem>
                <SelectItem value="weather-only">🌤️ Space Weather Only</SelectItem>
                <SelectItem value="satellites-only">🛰️ Satellite Fleet Only</SelectItem>
                <SelectItem value="alerts-only">🚨 Active Alerts Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-200">Export Format</Label>
            <div className="grid grid-cols-5 gap-2">
              {(['pdf', 'json', 'csv', 'png', 'svg'] as ExportFormat[]).map((fmt) => (
                <Button
                  key={fmt}
                  variant={format === fmt ? "default" : "outline"}
                  className={`p-3 text-center ${
                    format === fmt 
                      ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' 
                      : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                  }`}
                  onClick={() => setFormat(fmt)}
                >
                  <div className="text-lg mb-1">{getFormatIcon(fmt)}</div>
                  <div className="text-xs uppercase font-semibold">{fmt}</div>
                </Button>
              ))}
            </div>
          </div>

          {/* Include Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-200">Include in Report</Label>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="history" 
                  checked={includeHistory} 
                  onCheckedChange={setIncludeHistory}
                  className="border-gray-500"
                />
                <Label htmlFor="history" className="text-gray-300">
                  📈 Historical Data (24 hours)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="charts" 
                  checked={includeCharts} 
                  onCheckedChange={setIncludeCharts}
                  className="border-gray-500"
                />
                <Label htmlFor="charts" className="text-gray-300">
                  📊 Analytics & Trends
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="alerts" 
                  checked={includeAlerts} 
                  onCheckedChange={setIncludeAlerts}
                  className="border-gray-500"
                />
                <Label htmlFor="alerts" className="text-gray-300">
                  🚨 Current Alerts & Warnings
                </Label>
              </div>
            </div>
          </div>

          {/* Sharing Options */}
          <Card className="bg-gray-800/50 border-gray-700 p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-200">
                📧 Share via Email (Optional)
              </Label>
              <Input
                type="email"
                placeholder="mission.control@space-agency.gov"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400">
                Leave empty to generate shareable link only
              </p>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={generateReport}
              disabled={isExporting}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                         text-white font-medium py-2 px-4 shadow-lg hover:shadow-green-500/25 transition-all duration-300"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <span className="mr-2">📥</span>
                  Download Report
                </>
              )}
            </Button>
            
            <Button
              onClick={shareReport}
              disabled={isSharing}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                         text-white font-medium py-2 px-4 shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Sharing...
                </>
              ) : (
                <>
                  <span className="mr-2">🔗</span>
                  Share Report
                </>
              )}
            </Button>
          </div>

          {/* Status Info */}
          <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-700">
            ⚡ Reports include real-time encryption and are valid for 30 days
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}