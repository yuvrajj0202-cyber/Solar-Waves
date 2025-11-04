'use client';

import { Card } from '@/components/ui/card';
import { SpaceWeatherData } from '@/types/spaceWeather';

interface WeatherMetricsProps {
  data: SpaceWeatherData;
  compact?: boolean;
}

export function WeatherMetrics({ data, compact = false }: WeatherMetricsProps) {
  const getSeverityColor = (kIndex: number) => {
    if (kIndex >= 7) return 'text-red-400 bg-red-900/30';
    if (kIndex >= 5) return 'text-orange-400 bg-orange-900/30';
    if (kIndex >= 3) return 'text-yellow-400 bg-yellow-900/30';
    return 'text-green-400 bg-green-900/30';
  };

  const getSeverityLabel = (kIndex: number) => {
    if (kIndex >= 8) return 'Severe Storm';
    if (kIndex >= 6) return 'Strong Storm';
    if (kIndex >= 4) return 'Minor Storm';
    return 'Quiet';
  };

  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toFixed(decimals);
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Solar Wind</div>
          <div className="text-xl font-bold text-blue-400">
            {data.solarWind.velocity} km/s
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-gray-400">K-Index</div>
          <div className={`text-xl font-bold px-2 py-1 rounded ${getSeverityColor(data.geomagneticActivity.kIndex)}`}>
            {formatNumber(data.geomagneticActivity.kIndex)}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Magnetic Field</div>
          <div className="text-xl font-bold text-purple-400">
            {formatNumber(data.magneticField.bt)} nT
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Solar Flux</div>
          <div className="text-xl font-bold text-yellow-400">
            {data.solarActivity.solarFlux} sfu
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Conditions Header */}
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-400">Current Space Weather Conditions</h2>
            <div className="text-sm text-gray-400">
              Updated: {data.timestamp.toLocaleString()}
            </div>
          </div>
          
          <div className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-semibold ${getSeverityColor(data.geomagneticActivity.kIndex)}`}>
            <div className="w-3 h-3 rounded-full bg-current mr-3 animate-pulse"></div>
            {getSeverityLabel(data.geomagneticActivity.kIndex)}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Solar Wind */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-3"></div>
              Solar Wind
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Velocity</span>
                <span className="text-xl font-bold text-blue-400">
                  {data.solarWind.velocity} km/s
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Density</span>
                <span className="text-lg text-white">
                  {formatNumber(data.solarWind.density)} p/cm³
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Temperature</span>
                <span className="text-lg text-white">
                  {data.solarWind.temperature.toLocaleString()} K
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Magnetic Field */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center">
              <div className="w-4 h-4 rounded-full bg-purple-500 mr-3"></div>
              Magnetic Field
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total (Bt)</span>
                <span className="text-xl font-bold text-purple-400">
                  {formatNumber(data.magneticField.bt)} nT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Bx</span>
                <span className="text-lg text-white">
                  {formatNumber(data.magneticField.bx)} nT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">By</span>
                <span className="text-lg text-white">
                  {formatNumber(data.magneticField.by)} nT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Bz</span>
                <span className={`text-lg font-semibold ${
                  data.magneticField.bz < -5 ? 'text-red-400' : 
                  data.magneticField.bz > 5 ? 'text-green-400' : 'text-white'
                }`}>
                  {formatNumber(data.magneticField.bz)} nT
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Geomagnetic Activity */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-3"></div>
              Geomagnetic Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">K-Index</span>
                <span className={`text-xl font-bold px-2 py-1 rounded ${getSeverityColor(data.geomagneticActivity.kIndex)}`}>
                  {formatNumber(data.geomagneticActivity.kIndex)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Ap Index</span>
                <span className="text-lg text-white">
                  {data.geomagneticActivity.apIndex} nT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Dst Index</span>
                <span className={`text-lg ${
                  data.geomagneticActivity.dstIndex < -50 ? 'text-red-400' : 
                  data.geomagneticActivity.dstIndex < -30 ? 'text-orange-400' : 'text-white'
                }`}>
                  {data.geomagneticActivity.dstIndex} nT
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Solar Activity */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-3"></div>
              Solar Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Solar Flux</span>
                <span className="text-xl font-bold text-yellow-400">
                  {data.solarActivity.solarFlux} sfu
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">X-ray Flux</span>
                <span className="text-lg text-white">
                  {data.solarActivity.xrayFlux}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Proton Flux</span>
                <span className="text-lg text-white">
                  {data.solarActivity.protonFlux} p/cm²/s
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}