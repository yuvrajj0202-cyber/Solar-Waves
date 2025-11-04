'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeatherMetrics } from '@/components/WeatherMetrics';
import { AlertSystem } from '@/components/AlertSystem';
import { SatelliteSimulation } from '@/components/SatelliteSimulation';
import { WeatherChart } from '@/components/WeatherChart';
import { ReportExporter } from '@/components/ReportExporter';
import spaceWeatherService from '@/lib/spaceWeatherService';
import satelliteService from '@/lib/satelliteService';
import { SpaceWeatherData } from '@/types/spaceWeather';
import { SatelliteFleet } from '@/types/satellite';

export function SpaceWeatherDashboard() {
  const [spaceWeatherData, setSpaceWeatherData] = useState<SpaceWeatherData | null>(null);
  const [satelliteFleet, setSatelliteFleet] = useState<SatelliteFleet | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Initial data load
    setSpaceWeatherData(spaceWeatherService.getCurrentData());
    setSatelliteFleet(satelliteService.getFleet());

    // Subscribe to real-time updates
    const unsubscribeWeather = spaceWeatherService.subscribe((data) => {
      setSpaceWeatherData(data);
      // Automatically respond to space weather changes
      satelliteService.respondToSpaceWeather(data);
    });

    const unsubscribeSatellites = satelliteService.subscribe((fleet) => {
      setSatelliteFleet(fleet);
    });

    return () => {
      unsubscribeWeather();
      unsubscribeSatellites();
    };
  }, []);

  if (!spaceWeatherData || !satelliteFleet) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-gray-300">Initializing space weather monitoring systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <AlertSystem 
        alerts={spaceWeatherData.alerts}
        onAcknowledge={(alertId) => spaceWeatherService.acknowledgeAlert(alertId)}
      />

      {/* Export & Share Controls */}
      <div className="flex justify-end">
        <ReportExporter 
          currentData={spaceWeatherData}
          satelliteFleet={satelliteFleet}
        />
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border border-gray-700/50">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="weather" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Space Weather
          </TabsTrigger>
          <TabsTrigger 
            value="satellites" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Satellites
          </TabsTrigger>
          <TabsTrigger 
            value="charts" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Space Weather Summary */}
            <Card className="lg:col-span-2 bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-blue-400 mb-4">Current Space Weather</h2>
                <WeatherMetrics data={spaceWeatherData} compact={true} />
              </div>
            </Card>

            {/* Fleet Status */}
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-purple-400 mb-4">Fleet Status</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Satellites</span>
                    <span className="text-xl font-bold text-white">
                      {satelliteFleet.satellites.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Operational</span>
                    <span className="text-xl font-bold text-green-400">
                      {satelliteFleet.totalActive}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Safe Mode</span>
                    <span className="text-xl font-bold text-yellow-400">
                      {satelliteFleet.totalInSafeMode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">With Issues</span>
                    <span className="text-xl font-bold text-red-400">
                      {satelliteFleet.totalWithIssues}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-green-400 mb-4">Recent Satellite Activity</h2>
              <div className="space-y-3">
                {satelliteFleet.satellites
                  .flatMap(sat => 
                    sat.modeHistory.slice(0, 1).map(entry => ({ ...entry, satelliteName: sat.name }))
                  )
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .slice(0, 5)
                  .map((entry, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.mode === 'normal' ? 'bg-green-500' :
                          entry.mode === 'safe' ? 'bg-yellow-500' :
                          entry.mode === 'alert' ? 'bg-orange-500' :
                          entry.mode === 'emergency' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}></div>
                        <span className="text-gray-300">{entry.satelliteName}</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-white capitalize">{entry.mode} Mode</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="weather">
          <WeatherMetrics data={spaceWeatherData} />
        </TabsContent>

        <TabsContent value="satellites">
          <SatelliteSimulation fleet={satelliteFleet} />
        </TabsContent>

        <TabsContent value="charts">
          <WeatherChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}