'use client';

import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Satellite, SatelliteMode } from '@/types/satellite';

interface SatelliteCardProps {
  satellite: Satellite;
  onModeChange: (satelliteId: string, newMode: SatelliteMode) => void;
}

export function SatelliteCard({ satellite, onModeChange }: SatelliteCardProps) {
  const getModeColor = (mode: SatelliteMode) => {
    switch (mode) {
      case 'normal':
        return 'text-green-400 bg-green-900/30';
      case 'safe':
        return 'text-yellow-400 bg-yellow-900/30';
      case 'alert':
        return 'text-orange-400 bg-orange-900/30';
      case 'emergency':
        return 'text-red-400 bg-red-900/30';
      case 'maintenance':
        return 'text-blue-400 bg-blue-900/30';
      default:
        return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getStatusIcon = (operational: boolean, communicating: boolean) => {
    if (!operational) return '❌';
    if (!communicating) return '📡';
    return '✅';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'communication':
        return '📡';
      case 'gps':
        return '🧭';
      case 'scientific':
        return '🔬';
      case 'weather':
        return '🌤️';
      default:
        return '🛰️';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 70) return 'text-green-400';
    if (level > 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSignalStrength = (dbm: number) => {
    if (dbm > -60) return { strength: 'Excellent', color: 'text-green-400', bars: 4 };
    if (dbm > -70) return { strength: 'Good', color: 'text-green-400', bars: 3 };
    if (dbm > -80) return { strength: 'Fair', color: 'text-yellow-400', bars: 2 };
    return { strength: 'Poor', color: 'text-red-400', bars: 1 };
  };

  const signal = getSignalStrength(satellite.telemetry.signalStrength);

  return (
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getTypeIcon(satellite.type)}</span>
            <div>
              <h3 className="text-lg font-semibold text-white">{satellite.name}</h3>
              <p className="text-sm text-gray-400 capitalize">{satellite.type} Satellite</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStatusIcon(satellite.status.operational, satellite.status.communicating)}</span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getModeColor(satellite.mode)}`}>
              {satellite.mode.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Mode Control */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Operational Mode</label>
          <Select
            value={satellite.mode}
            onValueChange={(value: SatelliteMode) => onModeChange(satellite.id, value)}
          >
            <SelectTrigger className="bg-gray-700/50 border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="normal">Normal Operations</SelectItem>
              <SelectItem value="safe">Safe Mode</SelectItem>
              <SelectItem value="alert">Alert Status</SelectItem>
              <SelectItem value="emergency">Emergency Mode</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Telemetry */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Telemetry Data</h4>
          
          {/* Battery */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Battery Level</span>
              <span className={`text-sm font-medium ${getBatteryColor(satellite.telemetry.batteryLevel)}`}>
                {Math.round(satellite.telemetry.batteryLevel)}%
              </span>
            </div>
            <Progress 
              value={satellite.telemetry.batteryLevel} 
              className="h-2"
            />
          </div>

          {/* Signal Strength */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Signal Strength</span>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`w-1 h-4 rounded-sm ${
                      bar <= signal.bars ? signal.color.replace('text-', 'bg-') : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-sm font-medium ${signal.color}`}>
                {satellite.telemetry.signalStrength} dBm
              </span>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">Temperature</span>
            <span className="text-sm text-white">
              {Math.round(satellite.telemetry.temperature)}°C
            </span>
          </div>

          {/* Power Consumption */}
          <div className="flex justify-between">
            <span className="text-sm text-gray-400">Power Draw</span>
            <span className="text-sm text-white">
              {satellite.telemetry.powerConsumption}W
            </span>
          </div>
        </div>

        {/* Position */}
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Orbital Position</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Lat:</span>
              <span className="text-white ml-1">{satellite.position.latitude.toFixed(1)}°</span>
            </div>
            <div>
              <span className="text-gray-400">Lon:</span>
              <span className="text-white ml-1">{satellite.position.longitude.toFixed(1)}°</span>
            </div>
            <div>
              <span className="text-gray-400">Alt:</span>
              <span className="text-white ml-1">{satellite.position.altitude.toLocaleString()}km</span>
            </div>
          </div>
        </div>

        {/* Issues */}
        {satellite.status.issues.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <h4 className="text-sm font-medium text-red-400 mb-2">Active Issues</h4>
            <div className="space-y-1">
              {satellite.status.issues.map((issue, index) => (
                <div key={index} className="text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded">
                  {issue}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last update: {satellite.lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
}