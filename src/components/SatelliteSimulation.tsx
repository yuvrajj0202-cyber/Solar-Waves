'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { SatelliteCard } from '@/components/SatelliteCard';
import { SatelliteFleet, SatelliteMode } from '@/types/satellite';
import satelliteService from '@/lib/satelliteService';

interface SatelliteSimulationProps {
  fleet: SatelliteFleet;
}

export function SatelliteSimulation({ fleet }: SatelliteSimulationProps) {
  const handleModeChange = (satelliteId: string, newMode: SatelliteMode) => {
    satelliteService.setSatelliteMode(satelliteId, newMode);
  };

  const handleEmergencyProtocol = () => {
    const changed = satelliteService.setFleetToSafeMode('Emergency protocol activated by operator');
    if (changed > 0) {
      // Could show a toast notification here
    }
  };

  const getFleetHealthColor = () => {
    if (fleet.totalWithIssues > 2) return 'text-red-400';
    if (fleet.totalWithIssues > 0) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getOperationalPercentage = () => {
    return Math.round((fleet.totalActive / fleet.satellites.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Fleet Overview */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-purple-400">Satellite Fleet Control Center</h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Last Update: {fleet.lastUpdate.toLocaleTimeString()}
              </div>
              <Button 
                onClick={handleEmergencyProtocol}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                Emergency Safe Mode
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {fleet.satellites.length}
              </div>
              <div className="text-sm text-gray-400">Total Satellites</div>
            </div>
            
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className={`text-2xl font-bold ${getFleetHealthColor()}`}>
                {getOperationalPercentage()}%
              </div>
              <div className="text-sm text-gray-400">Operational</div>
            </div>
            
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">
                {fleet.totalInSafeMode}
              </div>
              <div className="text-sm text-gray-400">Safe Mode</div>
            </div>
            
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="text-2xl font-bold text-red-400">
                {fleet.totalWithIssues}
              </div>
              <div className="text-sm text-gray-400">With Issues</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                fleet.satellites.forEach(sat => {
                  if (sat.mode === 'safe') {
                    satelliteService.setSatelliteMode(sat.id, 'normal', 'Fleet return to normal operations');
                  }
                });
              }}
              variant="outline"
              className="bg-green-800/20 border-green-600 text-green-400 hover:bg-green-800/30"
            >
              Return All to Normal
            </Button>
            
            <Button
              onClick={() => {
                fleet.satellites.forEach(sat => {
                  if (sat.mode === 'normal') {
                    satelliteService.setSatelliteMode(sat.id, 'alert', 'Fleet wide alert status');
                  }
                });
              }}
              variant="outline"
              className="bg-orange-800/20 border-orange-600 text-orange-400 hover:bg-orange-800/30"
            >
              Set All to Alert
            </Button>
            
            <Button
              onClick={() => {
                fleet.satellites
                  .filter(sat => sat.type === 'communication')
                  .forEach(sat => {
                    satelliteService.setSatelliteMode(sat.id, 'maintenance', 'Scheduled maintenance cycle');
                  });
              }}
              variant="outline"
              className="bg-blue-800/20 border-blue-600 text-blue-400 hover:bg-blue-800/30"
            >
              Maintenance Mode (CommSats)
            </Button>
          </div>
        </div>
      </Card>

      {/* Individual Satellite Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {fleet.satellites.map((satellite) => (
          <SatelliteCard
            key={satellite.id}
            satellite={satellite}
            onModeChange={handleModeChange}
          />
        ))}
      </div>

      {/* Mode History */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Recent Mode Changes</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {fleet.satellites
              .flatMap(sat => 
                sat.modeHistory.map(entry => ({
                  ...entry,
                  satelliteName: sat.name,
                  satelliteType: sat.type
                }))
              )
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .slice(0, 20)
              .map((entry, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-3 px-4 bg-gray-700/30 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      entry.mode === 'normal' ? 'bg-green-500' :
                      entry.mode === 'safe' ? 'bg-yellow-500' :
                      entry.mode === 'alert' ? 'bg-orange-500' :
                      entry.mode === 'emergency' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}></div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{entry.satelliteName}</span>
                        <span className="text-xs text-gray-500 uppercase bg-gray-600 px-2 py-1 rounded">
                          {entry.satelliteType}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Changed to <span className="text-white capitalize">{entry.mode}</span> mode
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
                      {entry.timestamp.toLocaleString()}
                    </div>
                    <div className={`text-xs ${entry.automatic ? 'text-red-400' : 'text-blue-400'}`}>
                      {entry.automatic ? 'Automatic' : 'Manual'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </Card>
    </div>
  );
}