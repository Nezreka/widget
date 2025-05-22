// src/components/WeatherWidget.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';

// --- Interfaces & Types ---
export interface WeatherWidgetSettings {
  location?: string;
  units?: 'metric' | 'imperial';
  useCurrentLocation?: boolean;
}

interface WeatherWidgetProps {
  settings?: WeatherWidgetSettings;
  id: string; // Re-added id to match what page.tsx passes
}

// Structure for an individual hourly forecast item from API
interface ApiHourlyForecastValue {
  temperature?: number;
  weatherCode?: number;
}
interface ApiHourlyForecastEntry {
  time: string; // ISO string
  values: ApiHourlyForecastValue;
}


// Structure for an individual hourly forecast item (processed)
interface HourlyForecastItem {
  time: string; // Formatted time, e.g., "3 PM"
  dt: number; // Original timestamp for keys
  temperature?: number;
  weatherCode?: number;
}

// Expanded data structure to include hourly forecast
interface TomorrowWeatherData {
  current: {
    time?: string;
    temperature?: number;
    temperatureApparent?: number;
    weatherCode?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
  };
  hourly: HourlyForecastItem[];
  locationDisplay: {
    name?: string;
  };
}

// --- Weather Settings Panel ---
interface WeatherSettingsPanelProps {
  widgetId: string;
  currentSettings: WeatherWidgetSettings | undefined;
  onSave: (newSettings: WeatherWidgetSettings) => void;
}

export const WeatherSettingsPanel: React.FC<WeatherSettingsPanelProps> = ({ widgetId, currentSettings, onSave }) => {
  const [location, setLocation] = useState(currentSettings?.location || '97504 US');
  const [units, setUnits] = useState<'metric' | 'imperial'>(currentSettings?.units || 'imperial');
  const [useCurrentLocation, setUseCurrentLocation] = useState(currentSettings?.useCurrentLocation || false);

  const handleSaveClick = () => {
    onSave({
      location: useCurrentLocation ? undefined : location.trim(),
      units,
      useCurrentLocation
    });
  };

  const locationInputId = `weather-location-${widgetId}`;
  const unitsInputId = `weather-units-${widgetId}`;
  const useCurrentLocationId = `weather-use-current-location-${widgetId}`;

  return (
    <div className="space-y-4 text-primary">
      <div>
        <label htmlFor={useCurrentLocationId} className="flex items-center text-sm font-medium text-secondary mb-2 cursor-pointer">
          <input
            type="checkbox"
            id={useCurrentLocationId}
            checked={useCurrentLocation}
            onChange={(e) => setUseCurrentLocation(e.target.checked)}
            className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget"
          />
          Use My Current Location
        </label>
      </div>
      <div className={useCurrentLocation ? 'opacity-50' : ''}>
        <label htmlFor={locationInputId} className="block text-sm font-medium text-secondary mb-1">
          Manual Location (e.g., 97504 US, Medford OR):
        </label>
        <input
          type="text"
          id={locationInputId}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., 97504 US or Medford, OR"
          disabled={useCurrentLocation}
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary disabled:bg-slate-700 disabled:cursor-not-allowed"
        />
         {useCurrentLocation && <p className="text-xs text-secondary mt-1">Manual location disabled.</p>}
      </div>
      <div>
        <label htmlFor={unitsInputId} className="block text-sm font-medium text-secondary mb-1">
          Units:
        </label>
        <select
          id={unitsInputId}
          value={units}
          onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        >
          <option value="imperial">Imperial (°F, mph)</option>
          <option value="metric">Metric (°C, kph)</option>
        </select>
      </div>
      <button
        onClick={handleSaveClick}
        className="mt-6 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface"
      >
        Save Weather Settings
      </button>
    </div>
  );
};


// --- Main WeatherWidget Component ---
// The 'id' prop is accepted here due to WeatherWidgetProps, but not destructured or used directly in this component's body.
const WeatherWidget: React.FC<WeatherWidgetProps> = ({ settings }) => {
  const [weatherData, setWeatherData] = useState<TomorrowWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoCoordinates, setGeoCoordinates] = useState<string | null>(null);
  const [isRequestingGeo, setIsRequestingGeo] = useState(false);

  const API_KEY = process.env.NEXT_PUBLIC_TOMORROW_API_KEY;

  const mapTomorrowWeatherCodeToEmoji = (weatherCode?: number): string => {
    if (weatherCode === undefined) return '❓';
    switch (weatherCode) {
      case 1000: return '☀️'; case 1100: return '☀️'; case 1101: return '🌤️';
      case 1102: return '🌥️'; case 1001: return '☁️'; case 2000: return '🌫️';
      case 2100: return '🌫️'; case 4000: return '💧'; case 4001: return '🌧️';
      case 4200: return '🌦️'; case 4201: return '🌧️'; case 5000: return '❄️';
      case 5001: return '🌨️'; case 5100: return '🌨️'; case 5101: return '❄️';
      case 6000: return '🧊'; case 6001: return '🧊'; case 6200: return '🧊';
      case 6201: return '🧊'; case 7000: return '🧊'; case 7101: return '🧊';
      case 7102: return '🧊'; case 8000: return '⛈️';
      default: return '🌡️';
    }
  };

  const formatHour = (isoTime: string): string => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true }).replace(' ', '');
  };

  const fetchWeatherData = useCallback(async () => {
    if (!API_KEY) {
      setError("API key is missing. Configure NEXT_PUBLIC_TOMORROW_API_KEY.");
      setLoading(false); return;
    }

    let locationToQuery: string | undefined | null = settings?.location;
    if (settings?.useCurrentLocation) {
      if (geoCoordinates) locationToQuery = geoCoordinates;
      else {
        if (!isRequestingGeo) setError("Could not get current location. Check permissions or enter manually.");
        setLoading(false); return;
      }
    }

    if (!locationToQuery || typeof locationToQuery !== 'string' || locationToQuery.trim() === "") {
      setError("Location not set. Configure it or enable 'Use Current Location'.");
      setLoading(false); setWeatherData(null); return;
    }

    setLoading(true); setError(null);
    const trimmedLocation = locationToQuery.trim();
    const locationQueryParam = encodeURIComponent(trimmedLocation);
    const unitsQuery = settings?.units || 'imperial';
    const realtimeFields = "temperature,temperatureApparent,weatherCode,humidity,windSpeed,windDirection";
    const hourlyFields = "temperature,weatherCode";

    const realtimeApiUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${locationQueryParam}&units=${unitsQuery}&apikey=${API_KEY}&fields=${realtimeFields}`;
    const hourlyApiUrl = `https://api.tomorrow.io/v4/weather/forecast?location=${locationQueryParam}&timesteps=1h&units=${unitsQuery}&apikey=${API_KEY}&fields=${hourlyFields}`;

    try {
      const [realtimeResponse, hourlyResponse] = await Promise.all([
        fetch(realtimeApiUrl),
        fetch(hourlyApiUrl)
      ]);

      if (!realtimeResponse.ok || !hourlyResponse.ok) {
        let errorMsg = "Failed to fetch weather data.";
        if (!realtimeResponse.ok) {
          const errorData = await realtimeResponse.json();
          errorMsg = `Realtime Error: ${errorData.message || realtimeResponse.statusText}`;
          if (String(errorData.code).startsWith('400')) errorMsg += " - Check location format.";
        } else if (!hourlyResponse.ok) {
          const errorData = await hourlyResponse.json();
          errorMsg = `Hourly Forecast Error: ${errorData.message || hourlyResponse.statusText}`;
           if (String(errorData.code).startsWith('400')) errorMsg += " - Check location format.";
        }
        throw new Error(errorMsg);
      }

      const realtimeData = await realtimeResponse.json();
      const hourlyData = await hourlyResponse.json();

      const processedHourly: HourlyForecastItem[] = hourlyData.timelines?.hourly?.slice(0, 24).map((item: ApiHourlyForecastEntry) => ({
        time: formatHour(item.time),
        dt: new Date(item.time).getTime(),
        temperature: item.values.temperature,
        weatherCode: item.values.weatherCode,
      })) || [];

      setWeatherData({
        current: realtimeData.data.values,
        hourly: processedHourly,
        locationDisplay: { name: realtimeData.location?.name || trimmedLocation }
      });

    } catch (err: unknown) {
      console.error("Tomorrow.io fetch error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching weather data.");
      }
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, [settings?.location, settings?.units, settings?.useCurrentLocation, API_KEY, geoCoordinates, isRequestingGeo]);

  useEffect(() => {
    if (settings?.useCurrentLocation) {
      setIsRequestingGeo(true); setError(null);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGeoCoordinates(`${position.coords.latitude},${position.coords.longitude}`);
            setIsRequestingGeo(false);
          },
          (geoError) => {
            let msg = "Could not get current location.";
            if (geoError.code === geoError.PERMISSION_DENIED) msg = "Location permission denied.";
            else if (geoError.code === geoError.POSITION_UNAVAILABLE) msg = "Location information unavailable.";
            else if (geoError.code === geoError.TIMEOUT) msg = "Getting location timed out.";
            setError(msg + " Enter location manually.");
            setGeoCoordinates(null); setIsRequestingGeo(false); setLoading(false);
          }, { timeout: 10000 }
        );
      } else {
        setError("Geolocation not supported. Enter location manually.");
        setIsRequestingGeo(false); setLoading(false);
      }
    } else {
      setGeoCoordinates(null); setIsRequestingGeo(false);
    }
  }, [settings?.useCurrentLocation]);

  useEffect(() => {
    if (settings?.useCurrentLocation && isRequestingGeo) return;
    if (settings?.useCurrentLocation && !geoCoordinates && !settings.location) {
      if(!error) setError("Location needed."); setLoading(false); return;
    }
    fetchWeatherData();
  // The ESLint warning for missing 'error' and 'isRequestingGeo' in the dependency array
  // is intentional here. Adding them can cause re-fetch loops under certain error/geo-requesting conditions.
  // The logic is structured to prevent fetches while geo is pending or if an error already exists that needs user action.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.location, settings?.units, settings?.useCurrentLocation, geoCoordinates, fetchWeatherData]);


  const unitSymbol = settings?.units === 'metric' ? '°C' : '°F';
  const speedUnit = settings?.units === 'metric' ? 'kph' : 'mph';

  const commonMessageStyles = "p-4 h-full flex flex-col items-center justify-center text-center text-secondary";
  const neumorphicMessageCardStyles = "bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-[5px_5px_10px_rgba(0,0,0,0.2),-5px_-5px_10px_rgba(255,255,255,0.05)]";


  if (isRequestingGeo && settings?.useCurrentLocation && !error) {
    return <div className={`${commonMessageStyles} ${neumorphicMessageCardStyles}`}>Getting current location...</div>;
  }
  if (loading && !error) {
    return <div className={`${commonMessageStyles} ${neumorphicMessageCardStyles}`}>Loading weather data...</div>;
  }
  if (error) {
    return (
      <div className={`${commonMessageStyles} text-red-400 ${neumorphicMessageCardStyles}`}>
        <p className="font-semibold">Error:</p>
        <p className="text-sm mb-3">{error}</p>
        <button
          onClick={fetchWeatherData}
          className="mt-2 px-4 py-2 text-xs bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!weatherData || !weatherData.current) {
    return <div className={`${commonMessageStyles} ${neumorphicMessageCardStyles}`}>No weather data available. Please configure a location or check API key.</div>;
  }

  const { current, hourly, locationDisplay } = weatherData;
  const locationName = locationDisplay?.name || (settings?.useCurrentLocation && geoCoordinates ? "Current Location" : settings?.location) || "Selected Location";

  return (
    <div
      className="p-4 bg-slate-800/70 dark:bg-slate-800/70 backdrop-blur-md text-primary rounded-xl h-full flex flex-col justify-between overflow-hidden shadow-[8px_8px_16px_rgba(0,0,0,0.3),-8px_-8px_16px_rgba(255,255,255,0.08)]"
    >
      <div className="mb-3 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-1.5">
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-bold leading-tight text-slate-100 whitespace-normal break-words"
              title={locationName}
            >
              {locationName}
            </h3>
          </div>
          <div className="text-4xl ml-3 flex-shrink-0">{mapTomorrowWeatherCodeToEmoji(current.weatherCode)}</div>
        </div>

        <div className="text-5xl font-light text-slate-50 mb-0.5">
          {current.temperature !== undefined ? `${Math.round(current.temperature)}${unitSymbol}` : 'N/A'}
        </div>
        <div className="text-sm text-slate-300 mb-3">
          {current.temperatureApparent !== undefined && `Feels like ${Math.round(current.temperatureApparent)}${unitSymbol}`}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-300 mt-auto">
          <p>Humidity: <span className="font-medium text-slate-100">{current.humidity !== undefined ? `${Math.round(current.humidity)}%` : 'N/A'}</span></p>
          <p>Wind: <span className="font-medium text-slate-100">{current.windSpeed !== undefined ? `${Math.round(current.windSpeed)} ${speedUnit}` : 'N/A'}</span></p>
        </div>
      </div>

      {hourly && hourly.length > 0 && (
        <div className="mt-auto pt-3 border-t border-slate-700/50">
          <p className="text-xs font-semibold mb-2 px-1 text-slate-300">Hourly Forecast</p>
          <div className="flex overflow-x-auto space-x-2.5 pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
            {hourly.map((hour) => (
              <div
                key={hour.dt}
                className="flex-shrink-0 w-[65px] text-center p-2 bg-slate-700/50 dark:bg-slate-700/50 rounded-lg shadow-md"
              >
                <div className="text-xs font-medium text-slate-300">{hour.time}</div>
                <div className="text-2xl my-1">{mapTomorrowWeatherCodeToEmoji(hour.weatherCode)}</div>
                <div className="text-sm text-slate-100">
                  {hour.temperature !== undefined ? `${Math.round(hour.temperature)}${unitSymbol}` : 'N/A'}
                </div>
              </div>
            ))}
            <div className="flex-shrink-0 w-0.5"></div>
          </div>
        </div>
      )}
       {!hourly || hourly.length === 0 && !loading && !error && (
         <div className="mt-auto pt-3 border-t border-slate-700/50 text-center text-xs text-slate-400">
            Hourly forecast data not available.
         </div>
       )}
    </div>
  );
};

export default WeatherWidget;
