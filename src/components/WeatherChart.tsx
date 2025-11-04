'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import spaceWeatherService from '@/lib/spaceWeatherService';
import { SpaceWeatherData } from '@/types/spaceWeather';

type ChartMetric = 'kIndex' | 'solarWind' | 'magneticField' | 'solarFlux';

interface ChartDataPoint {
  time: string;
  timestamp: number;
  kIndex: number;
  solarWind: number;
  magneticFieldBt: number;
  magneticFieldBz: number;
  solarFlux: number;
}

export function WeatherChart() {
  const [historicalData, setHistoricalData] = useState<SpaceWeatherData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('kIndex');

  useEffect(() => {
    const loadData = () => {
      setHistoricalData(spaceWeatherService.getHistoricalData());
    };

    loadData();
    const unsubscribe = spaceWeatherService.subscribe(() => {
      loadData();
    });

    return unsubscribe;
  }, []);

  const prepareChartData = (): ChartDataPoint[] => {
    return historicalData.map((data) => ({
      time: data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: data.timestamp.getTime(),
      kIndex: data.geomagneticActivity.kIndex,
      solarWind: data.solarWind.velocity,
      magneticFieldBt: data.magneticField.bt,
      magneticFieldBz: data.magneticField.bz,
      solarFlux: data.solarActivity.solarFlux
    }));
  };

  const getChartConfig = (metric: ChartMetric) => {
    switch (metric) {
      case 'kIndex':
        return {
          title: 'Geomagnetic Activity (K-Index)',
          dataKey: 'kIndex',
          color: '#10b981',
          unit: '',
          thresholds: [
            { value: 4, label: 'Minor Storm', color: '#fbbf24' },
            { value: 5, label: 'Moderate Storm', color: '#f97316' },
            { value: 6, label: 'Strong Storm', color: '#ef4444' }
          ]
        };
      case 'solarWind':
        return {
          title: 'Solar Wind Velocity',
          dataKey: 'solarWind',
          color: '#3b82f6',
          unit: ' km/s',
          thresholds: [
            { value: 500, label: 'High Speed', color: '#fbbf24' },
            { value: 700, label: 'Very High Speed', color: '#ef4444' }
          ]
        };
      case 'magneticField':
        return {
          title: 'Magnetic Field Components',
          dataKey: 'magneticFieldBt',
          secondaryKey: 'magneticFieldBz',
          color: '#8b5cf6',
          secondaryColor: '#ec4899',
          unit: ' nT',
          thresholds: [
            { value: -10, label: 'Strong Southward Bz', color: '#ef4444' }
          ]
        };
      case 'solarFlux':
        return {
          title: 'Solar Flux (F10.7)',
          dataKey: 'solarFlux',
          color: '#eab308',
          unit: ' sfu',
          thresholds: [
            { value: 150, label: 'Enhanced Activity', color: '#f97316' },
            { value: 200, label: 'High Activity', color: '#ef4444' }
          ]
        };
      default:
        return {
          title: 'K-Index',
          dataKey: 'kIndex',
          color: '#10b981',
          unit: '',
          thresholds: []
        };
    }
  };

  const chartData = prepareChartData();
  const config = getChartConfig(selectedMetric);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800/90 backdrop-blur border border-gray-700 rounded-lg p-3 text-white">
          <p className="text-gray-300 mb-1">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {`${entry.name}: ${entry.value}${config.unit}`}
            </p>
          ))}
          {selectedMetric === 'kIndex' && (
            <p className="text-xs text-gray-400 mt-1">
              {data.kIndex >= 6 ? 'Strong Storm' : 
               data.kIndex >= 4 ? 'Minor Storm' : 
               'Quiet Conditions'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-cyan-400">Space Weather Analytics</h2>
            <Select value={selectedMetric} onValueChange={(value: ChartMetric) => setSelectedMetric(value)}>
              <SelectTrigger className="w-64 bg-gray-700/50 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="kIndex">K-Index (Geomagnetic)</SelectItem>
                <SelectItem value="solarWind">Solar Wind Velocity</SelectItem>
                <SelectItem value="magneticField">Magnetic Field</SelectItem>
                <SelectItem value="solarFlux">Solar Flux</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Main line */}
                <Line
                  type="monotone"
                  dataKey={config.dataKey}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                  name={config.title}
                />
                
                {/* Secondary line for magnetic field */}
                {selectedMetric === 'magneticField' && (
                  <Line
                    type="monotone"
                    dataKey="magneticFieldBz"
                    stroke={config.secondaryColor}
                    strokeWidth={2}
                    dot={false}
                    name="Bz Component"
                    strokeDasharray="5 5"
                  />
                )}
                
                {/* Threshold lines */}
                {config.thresholds?.map((threshold, index) => (
                  <ReferenceLine
                    key={index}
                    y={threshold.value}
                    stroke={threshold.color}
                    strokeDasharray="3 3"
                    strokeOpacity={0.7}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-0.5 rounded"
                style={{ backgroundColor: config.color }}
              ></div>
              <span className="text-sm text-gray-300">
                {selectedMetric === 'magneticField' ? 'Bt (Total)' : config.title}
              </span>
            </div>
            
            {selectedMetric === 'magneticField' && (
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-0.5 rounded border-dashed border-2"
                  style={{ borderColor: config.secondaryColor }}
                ></div>
                <span className="text-sm text-gray-300">Bz Component</span>
              </div>
            )}
            
            {config.thresholds?.map((threshold, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-0.5 rounded border-dashed border-2"
                  style={{ borderColor: threshold.color }}
                ></div>
                <span className="text-xs text-gray-400">{threshold.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Current Values Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {chartData.length > 0 ? chartData[chartData.length - 1].kIndex.toFixed(1) : '-.--'}
            </div>
            <div className="text-sm text-gray-400">K-Index</div>
          </div>
        </Card>
        
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {chartData.length > 0 ? chartData[chartData.length - 1].solarWind : '---'}
            </div>
            <div className="text-sm text-gray-400">Solar Wind km/s</div>
          </div>
        </Card>
        
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {chartData.length > 0 ? chartData[chartData.length - 1].magneticFieldBt.toFixed(1) : '-.--'}
            </div>
            <div className="text-sm text-gray-400">Magnetic Field nT</div>
          </div>
        </Card>
        
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {chartData.length > 0 ? chartData[chartData.length - 1].solarFlux : '---'}
            </div>
            <div className="text-sm text-gray-400">Solar Flux sfu</div>
          </div>
        </Card>
      </div>
    </div>
  );
}