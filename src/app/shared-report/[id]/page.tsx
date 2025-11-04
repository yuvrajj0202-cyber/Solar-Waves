'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeatherMetrics } from '@/components/WeatherMetrics';
import { SatelliteCard } from '@/components/SatelliteCard';
import shareService, { ShareableReport } from '@/lib/shareService';

export default function SharedReportPage() {
  const params = useParams();
  const shareId = params.id as string;
  const [report, setReport] = useState<ShareableReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const sharedReport = shareService.getSharedReport(shareId);
        if (!sharedReport) {
          setError('Report not found or has expired');
        } else {
          setReport(sharedReport);
        }
      } catch (err) {
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      loadReport();
    }
  }, [shareId]);

  const downloadReport = (format: string) => {
    if (!report) return;
    
    const content = shareService.exportToFormat(report, format);
    const timestamp = report.metadata.generated.toISOString();
    const filename = `space-weather-report-${timestamp.slice(0, 19).replace(/:/g, '-')}.${format}`;
    
    const mimeTypes: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv',
      xml: 'application/xml',
      txt: 'text/plain'
    };
    
    const blob = new Blob([content], { type: mimeTypes[format] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-white text-lg">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm p-8 max-w-md">
          <div className="text-center space-y-4">
            <div className="text-6xl">❌</div>
            <h1 className="text-xl font-bold text-white">Report Not Found</h1>
            <p className="text-gray-300">
              {error || 'The requested report does not exist or has expired.'}
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isExpired = new Date() > report.data.validUntil;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/20"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Shared Space Weather Report
                </h1>
                <p className="text-sm text-gray-400">
                  Generated: {report.metadata.generated.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isExpired && (
                <div className="bg-red-900/50 border border-red-600 text-red-400 px-3 py-1 rounded-full text-sm">
                  ⚠️ Expired
                </div>
              )}
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => downloadReport('json')}
                  className="bg-blue-800/20 border-blue-600 text-blue-400"
                >
                  📄 JSON
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => downloadReport('csv')}
                  className="bg-green-800/20 border-green-600 text-green-400"
                >
                  📊 CSV
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => downloadReport('txt')}
                  className="bg-purple-800/20 border-purple-600 text-purple-400"
                >
                  📝 TXT
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Report Metadata */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm p-6">
            <h2 className="text-lg font-semibold text-cyan-400 mb-4">Report Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-400">Type</div>
                <div className="text-white font-medium capitalize">
                  {report.type.replace('-', ' ')}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Generated</div>
                <div className="text-white font-medium">
                  {report.metadata.generated.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Valid Until</div>
                <div className={`font-medium ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                  {report.data.validUntil.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Share ID</div>
                <div className="text-white font-mono text-sm">
                  {shareId}
                </div>
              </div>
            </div>
          </Card>

          {/* Space Weather Data */}
          {report.data.spaceWeather && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-blue-400">Space Weather Conditions</h2>
              <WeatherMetrics 
                data={report.data.spaceWeather}
                compact={false}
              />
            </div>
          )}

          {/* Satellite Data */}
          {report.data.satellites && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-purple-400">Satellite Fleet Status</h2>
              
              {/* Fleet Summary */}
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {report.data.satellites.satellites.length}
                    </div>
                    <div className="text-sm text-gray-400">Total Satellites</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {report.data.satellites.totalActive}
                    </div>
                    <div className="text-sm text-gray-400">Operational</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {report.data.satellites.totalInSafeMode}
                    </div>
                    <div className="text-sm text-gray-400">Safe Mode</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {report.data.satellites.totalWithIssues}
                    </div>
                    <div className="text-sm text-gray-400">With Issues</div>
                  </div>
                </div>
              </Card>

              {/* Individual Satellites */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {report.data.satellites.satellites.map((satellite) => (
                  <SatelliteCard
                    key={satellite.id}
                    satellite={satellite}
                    onModeChange={() => {}} // Read-only mode
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm p-4">
            <div className="text-center text-sm text-gray-400">
              <p>🛰️ Generated by Space Weather Control Center</p>
              <p>This is a read-only view of the shared report. Data reflects conditions at time of generation.</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}