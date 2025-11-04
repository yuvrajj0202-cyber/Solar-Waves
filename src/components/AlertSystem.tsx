'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SpaceWeatherAlert, AlertSeverity } from '@/types/spaceWeather';

interface AlertSystemProps {
  alerts: SpaceWeatherAlert[];
  onAcknowledge: (alertId: string) => void;
}

export function AlertSystem({ alerts, onAcknowledge }: AlertSystemProps) {
  const activeAlerts = alerts.filter(alert => !alert.acknowledged && new Date() < alert.expires);

  if (activeAlerts.length === 0) {
    return null;
  }

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'extreme':
        return 'bg-red-900/80 border-red-500 text-red-100';
      case 'severe':
        return 'bg-red-800/60 border-red-400 text-red-100';
      case 'strong':
        return 'bg-orange-800/60 border-orange-400 text-orange-100';
      case 'moderate':
        return 'bg-yellow-800/60 border-yellow-400 text-yellow-100';
      case 'minor':
        return 'bg-blue-800/60 border-blue-400 text-blue-100';
      default:
        return 'bg-gray-800/60 border-gray-400 text-gray-100';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    if (severity === 'extreme' || severity === 'severe') {
      return '🚨';
    }
    if (severity === 'strong') {
      return '⚠️';
    }
    return '⚡';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'geomagnetic':
        return '🧲';
      case 'solar_radiation':
        return '☀️';
      case 'radio_blackout':
        return '📻';
      default:
        return '⚡';
    }
  };

  return (
    <div className="space-y-3">
      {activeAlerts.map((alert) => (
        <Card
          key={alert.id}
          className={`p-4 ${getSeverityStyles(alert.severity)} backdrop-blur-sm animate-pulse`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex space-x-2 text-lg">
                <span>{getSeverityIcon(alert.severity)}</span>
                <span>{getTypeIcon(alert.type)}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-lg">
                    {alert.title}
                  </h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/20 uppercase">
                    {alert.severity}
                  </span>
                </div>
                
                <p className="text-sm opacity-90 mb-2">
                  {alert.description}
                </p>
                
                <div className="flex items-center space-x-4 text-xs opacity-75">
                  <span>
                    Issued: {alert.issued.toLocaleTimeString()}
                  </span>
                  <span>
                    Expires: {alert.expires.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => onAcknowledge(alert.id)}
              size="sm"
              variant="outline"
              className="bg-black/20 border-current hover:bg-black/40 text-current"
            >
              Acknowledge
            </Button>
          </div>
        </Card>
      ))}
      
      {/* Summary bar for multiple alerts */}
      {activeAlerts.length > 1 && (
        <div className="text-center text-sm text-gray-400">
          <span className="inline-flex items-center space-x-2 bg-gray-800/50 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span>{activeAlerts.length} active alerts</span>
          </span>
        </div>
      )}
    </div>
  );
}