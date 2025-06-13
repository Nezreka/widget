"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces & Types ---
export interface WeatherWidgetSettings {
  location?: string;
  units?: 'metric' | 'imperial';
  useCurrentLocation?: boolean;
  theme?: 'auto' | 'light' | 'dark' | 'weather-adaptive';
  animationSpeed?: 'slow' | 'normal' | 'fast';
  showExtendedForecast?: boolean;
  updateInterval?: number; // in minutes
  displayDensity?: 'compact' | 'comfortable' | 'spacious';
}

interface WeatherWidgetProps {
  settings?: WeatherWidgetSettings;
  id: string;
}

// Enhanced API interfaces
interface TomorrowCurrentWeather {
  time?: string;
  temperature?: number;
  temperatureApparent?: number;
  weatherCode?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: number;
  uvIndex?: number;
  visibility?: number;
  pressure?: number;
  cloudCover?: number;
}

interface TomorrowHourlyForecast {
  time: string;
  values: {
    temperature?: number;
    weatherCode?: number;
    precipitationProbability?: number;
    windSpeed?: number;
  };
}

interface TomorrowDailyForecast {
  time: string;
  values: {
    temperatureMin?: number;
    temperatureMax?: number;
    weatherCode?: number;
    precipitationProbability?: number;
    windSpeed?: number;
    uvIndex?: number;
  };
}

interface ProcessedHourlyForecast {
  time: string;
  hour: string;
  temperature?: number;
  weatherCode?: number;
  precipitationProbability?: number;
  windSpeed?: number;
}

interface ProcessedDailyForecast {
  time: string;
  day: string;
  temperatureMin?: number;
  temperatureMax?: number;
  weatherCode?: number;
  precipitationProbability?: number;
  windSpeed?: number;
  uvIndex?: number;
}

interface EnhancedWeatherData {
  current: TomorrowCurrentWeather;
  hourly: ProcessedHourlyForecast[];
  daily: ProcessedDailyForecast[];
  location: {
    name: string;
    coordinates?: { lat: number; lon: number };
  };
  lastUpdated: number;
}

// Weather condition mappings with enhanced data
const WEATHER_CONDITIONS = {
  1000: { emoji: '☀️', name: 'Clear', bg: 'from-yellow-400 to-orange-500', particles: 'sun-rays' },
  1100: { emoji: '🌤️', name: 'Mostly Clear', bg: 'from-yellow-300 to-blue-400', particles: 'light-clouds' },
  1101: { emoji: '⛅', name: 'Partly Cloudy', bg: 'from-blue-400 to-gray-400', particles: 'clouds' },
  1102: { emoji: '☁️', name: 'Mostly Cloudy', bg: 'from-gray-400 to-gray-600', particles: 'heavy-clouds' },
  1001: { emoji: '☁️', name: 'Cloudy', bg: 'from-gray-500 to-gray-700', particles: 'overcast' },
  2000: { emoji: '🌫️', name: 'Fog', bg: 'from-gray-300 to-gray-500', particles: 'fog' },
  2100: { emoji: '🌫️', name: 'Light Fog', bg: 'from-gray-200 to-gray-400', particles: 'light-fog' },
  4000: { emoji: '🌦️', name: 'Drizzle', bg: 'from-blue-500 to-gray-600', particles: 'drizzle' },
  4001: { emoji: '🌧️', name: 'Rain', bg: 'from-blue-600 to-gray-700', particles: 'rain' },
  4200: { emoji: '🌧️', name: 'Light Rain', bg: 'from-blue-400 to-gray-500', particles: 'light-rain' },
  4201: { emoji: '⛈️', name: 'Heavy Rain', bg: 'from-blue-800 to-gray-900', particles: 'heavy-rain' },
  5000: { emoji: '🌨️', name: 'Snow', bg: 'from-blue-200 to-gray-400', particles: 'snow' },
  5001: { emoji: '❄️', name: 'Flurries', bg: 'from-blue-100 to-gray-300', particles: 'light-snow' },
  5100: { emoji: '🌨️', name: 'Light Snow', bg: 'from-blue-200 to-gray-300', particles: 'light-snow' },
  5101: { emoji: '❄️', name: 'Heavy Snow', bg: 'from-blue-300 to-gray-500', particles: 'heavy-snow' },
  6000: { emoji: '🧊', name: 'Freezing Drizzle', bg: 'from-cyan-300 to-blue-600', particles: 'ice' },
  6001: { emoji: '🧊', name: 'Freezing Rain', bg: 'from-cyan-400 to-blue-700', particles: 'freezing-rain' },
  6200: { emoji: '🧊', name: 'Light Freezing Rain', bg: 'from-cyan-200 to-blue-500', particles: 'light-ice' },
  6201: { emoji: '🧊', name: 'Heavy Freezing Rain', bg: 'from-cyan-500 to-blue-800', particles: 'heavy-ice' },
  7000: { emoji: '🧊', name: 'Ice Pellets', bg: 'from-cyan-300 to-gray-600', particles: 'ice-pellets' },
  7101: { emoji: '🧊', name: 'Heavy Ice Pellets', bg: 'from-cyan-400 to-gray-700', particles: 'heavy-ice-pellets' },
  7102: { emoji: '🧊', name: 'Light Ice Pellets', bg: 'from-cyan-200 to-gray-500', particles: 'light-ice-pellets' },
  8000: { emoji: '⛈️', name: 'Thunderstorm', bg: 'from-purple-600 to-gray-900', particles: 'thunderstorm' },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const temperatureVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

// --- Settings Panel ---
interface WeatherSettingsPanelProps {
  widgetId: string;
  currentSettings: WeatherWidgetSettings | undefined;
  onSave: (newSettings: WeatherWidgetSettings) => void;
}

export const WeatherSettingsPanel: React.FC<WeatherSettingsPanelProps> = ({ 
  widgetId, 
  currentSettings, 
  onSave 
}) => {
  const [location, setLocation] = useState(currentSettings?.location || '97504 US');
  const [units, setUnits] = useState<'metric' | 'imperial'>(currentSettings?.units || 'imperial');
  const [useCurrentLocation, setUseCurrentLocation] = useState(currentSettings?.useCurrentLocation || false);
  const [theme, setTheme] = useState<NonNullable<WeatherWidgetSettings['theme']>>(currentSettings?.theme || 'weather-adaptive');
  const [animationSpeed, setAnimationSpeed] = useState<NonNullable<WeatherWidgetSettings['animationSpeed']>>(currentSettings?.animationSpeed || 'normal');
  const [showExtendedForecast, setShowExtendedForecast] = useState(currentSettings?.showExtendedForecast !== false);
  const [updateInterval, setUpdateInterval] = useState<number>(currentSettings?.updateInterval || 5);
  const [displayDensity, setDisplayDensity] = useState<NonNullable<WeatherWidgetSettings['displayDensity']>>(currentSettings?.displayDensity || 'comfortable');

  const handleSaveClick = () => {
    onSave({
      location: useCurrentLocation ? undefined : location.trim(),
      units,
      useCurrentLocation,
      theme,
      animationSpeed,
      showExtendedForecast,
      updateInterval,
      displayDensity
    });
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary";
  const labelClass = "block text-sm font-medium text-secondary mb-1";

  return (
    <div className="space-y-6 text-primary">
      {/* Location Settings */}
      <div>
        <label className="flex items-center text-sm font-medium text-secondary mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useCurrentLocation}
            onChange={(e) => setUseCurrentLocation(e.target.checked)}
            className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget"
          />
          Use Current Location
        </label>
        <div className={useCurrentLocation ? 'opacity-50' : ''}>
          <label htmlFor={`weather-location-${widgetId}`} className={labelClass}>
            Location (city, zip code, coordinates):
          </label>
          <input
            type="text"
            id={`weather-location-${widgetId}`}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., New York, 10001, 40.7128,-74.0060"
            disabled={useCurrentLocation}
            className={inputClass}
          />
        </div>
      </div>

      {/* Units */}
      <div>
        <label htmlFor={`weather-units-${widgetId}`} className={labelClass}>
          Temperature Units:
        </label>
        <select
          id={`weather-units-${widgetId}`}
          value={units}
          onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}
          className={inputClass}
        >
          <option value="imperial">Imperial (°F, mph)</option>
          <option value="metric">Metric (°C, km/h)</option>
        </select>
      </div>

      {/* Theme */}
      <div>
        <label htmlFor={`weather-theme-${widgetId}`} className={labelClass}>
          Visual Theme:
        </label>
        <select
          id={`weather-theme-${widgetId}`}
          value={theme}
          onChange={(e) => setTheme(e.target.value as NonNullable<WeatherWidgetSettings['theme']>)}
          className={inputClass}
        >
          <option value="weather-adaptive">Weather Adaptive</option>
          <option value="auto">Auto (System)</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* Animation Speed */}
      <div>
        <label htmlFor={`weather-animation-${widgetId}`} className={labelClass}>
          Animation Speed:
        </label>
        <select
          id={`weather-animation-${widgetId}`}
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(e.target.value as NonNullable<WeatherWidgetSettings['animationSpeed']>)}
          className={inputClass}
        >
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </div>

      {/* Display Options */}
      <div>
        <label htmlFor={`weather-density-${widgetId}`} className={labelClass}>
          Display Density:
        </label>
        <select
          id={`weather-density-${widgetId}`}
          value={displayDensity}
          onChange={(e) => setDisplayDensity(e.target.value as NonNullable<WeatherWidgetSettings['displayDensity']>)}
          className={inputClass}
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="spacious">Spacious</option>
        </select>
      </div>

      {/* Extended Forecast */}
      <div>
        <label className="flex items-center text-sm font-medium text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={showExtendedForecast}
            onChange={(e) => setShowExtendedForecast(e.target.checked)}
            className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget"
          />
          Show Extended Forecast
        </label>
      </div>

      {/* Update Interval */}
      <div>
        <label htmlFor={`weather-interval-${widgetId}`} className={labelClass}>
          Update Interval (minutes):
        </label>
        <input
          type="number"
          id={`weather-interval-${widgetId}`}
          value={updateInterval}
          onChange={(e) => setUpdateInterval(Math.max(1, Number(e.target.value)))}
          min="1"
          max="60"
          className={inputClass}
        />
      </div>

      <button
        onClick={handleSaveClick}
        className="w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface transition-all duration-200"
      >
        Save Weather Settings
      </button>
    </div>
  );
};

// --- Weather Particles Component ---
const WeatherParticles: React.FC<{ type: string; intensity?: number }> = ({ type, intensity = 1 }) => {
  const particleCount = Math.floor(50 * intensity);
  
  const getParticleStyle = () => {
    const delay = Math.random() * 5;
    const duration = 3 + Math.random() * 4;
    const size = 2 + Math.random() * 4;
    
    return {
      left: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      width: `${size}px`,
      height: `${size}px`,
    };
  };

  if (!type || type === 'none') return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => (
        <div
          key={i}
          className={`absolute rounded-full opacity-70 ${
            type.includes('rain') ? 'bg-blue-300 animate-rain' :
            type.includes('snow') ? 'bg-white animate-snow' :
            type.includes('sun') ? 'bg-yellow-300 animate-float' :
            'bg-gray-300 animate-float'
          }`}
          style={getParticleStyle()}
        />
      ))}
    </div>
  );
};

// --- Animated Counter Component ---
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | undefined>(undefined);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const startValue = displayValue;
    const difference = value - startValue;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.round(startValue + difference * easeOut));
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    startTimeRef.current = undefined;
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, displayValue]);

  return <span>{displayValue}</span>;
};

// --- Main WeatherWidget Component ---
const WeatherWidget: React.FC<WeatherWidgetProps> = ({ settings }) => {
  const [weatherData, setWeatherData] = useState<EnhancedWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoCoordinates, setGeoCoordinates] = useState<string | null>(null);
  const [isRequestingGeo, setIsRequestingGeo] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [currentView, setCurrentView] = useState<'current' | 'hourly' | 'daily'>('current');

  const updateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const API_KEY = process.env.NEXT_PUBLIC_TOMORROW_API_KEY;

  // Get weather condition info
  const getWeatherCondition = (weatherCode?: number) => {
    return WEATHER_CONDITIONS[weatherCode as keyof typeof WEATHER_CONDITIONS] || 
           { emoji: '🌡️', name: 'Unknown', bg: 'from-gray-400 to-gray-600', particles: 'none' };
  };

  // Reverse geocoding to get city name
  const getCityName = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&apikey=${API_KEY}`
      );
      const data = await response.json();
      return data.location?.name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    } catch {
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
  }, [API_KEY]);

  // Enhanced data fetching
  const fetchWeatherData = useCallback(async () => {
    if (!API_KEY) {
      setError("API key is missing. Configure NEXT_PUBLIC_TOMORROW_API_KEY.");
      setLoading(false);
      return;
    }

    let locationToQuery: string | undefined | null = settings?.location;
    if (settings?.useCurrentLocation) {
      if (geoCoordinates) {
        locationToQuery = geoCoordinates;
      } else {
        if (!isRequestingGeo) {
          setError("Could not get current location. Check permissions or enter manually.");
        }
        setLoading(false);
        return;
      }
    }

    if (!locationToQuery || typeof locationToQuery !== 'string' || locationToQuery.trim() === "") {
      setError("Location not set. Configure it or enable 'Use Current Location'.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const trimmedLocation = locationToQuery.trim();
    const locationQueryParam = encodeURIComponent(trimmedLocation);
    const unitsQuery = settings?.units || 'imperial';
    
    const realtimeFields = "temperature,temperatureApparent,weatherCode,humidity,windSpeed,windDirection,uvIndex,visibility,pressure,cloudCover";
    const hourlyFields = "temperature,weatherCode,precipitationProbability,windSpeed";
    const dailyFields = "temperatureMin,temperatureMax,weatherCode,precipitationProbability,windSpeed,uvIndex";

    try {
      const [realtimeResponse, hourlyResponse, dailyResponse] = await Promise.all([
        fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${locationQueryParam}&units=${unitsQuery}&apikey=${API_KEY}&fields=${realtimeFields}`),
        fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${locationQueryParam}&timesteps=1h&units=${unitsQuery}&apikey=${API_KEY}&fields=${hourlyFields}`),
        fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${locationQueryParam}&timesteps=1d&units=${unitsQuery}&apikey=${API_KEY}&fields=${dailyFields}`)
      ]);

      if (!realtimeResponse.ok || !hourlyResponse.ok || !dailyResponse.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const [realtimeData, hourlyData, dailyData] = await Promise.all([
        realtimeResponse.json(),
        hourlyResponse.json(),
        dailyResponse.json()
      ]);

      // Process hourly data
      const processedHourly: ProcessedHourlyForecast[] = (hourlyData.timelines?.hourly?.slice(0, 24) || []).map((item: TomorrowHourlyForecast) => ({
        time: item.time,
        hour: new Date(item.time).toLocaleTimeString(undefined, { hour: 'numeric', hour12: true }),
        temperature: item.values.temperature,
        weatherCode: item.values.weatherCode,
        precipitationProbability: item.values.precipitationProbability,
        windSpeed: item.values.windSpeed,
      }));

      // Process daily data
      const processedDaily: ProcessedDailyForecast[] = (dailyData.timelines?.daily?.slice(0, 7) || []).map((item: TomorrowDailyForecast) => ({
        time: item.time,
        day: new Date(item.time).toLocaleDateString(undefined, { weekday: 'short' }),
        temperatureMin: item.values.temperatureMin,
        temperatureMax: item.values.temperatureMax,
        weatherCode: item.values.weatherCode,
        precipitationProbability: item.values.precipitationProbability,
        windSpeed: item.values.windSpeed,
        uvIndex: item.values.uvIndex,
      }));

      // Get location name
      let displayName = realtimeData.location?.name;
      if (!displayName && settings?.useCurrentLocation && geoCoordinates) {
        const coords = geoCoordinates.split(',');
        if (coords.length === 2) {
          displayName = await getCityName(parseFloat(coords[0]), parseFloat(coords[1]));
        }
      }
      if (!displayName) {
        displayName = settings?.useCurrentLocation ? "Current Location" : trimmedLocation;
      }

      setWeatherData({
        current: realtimeData.data.values,
        hourly: processedHourly,
        daily: processedDaily,
        location: {
          name: displayName,
          coordinates: geoCoordinates ? {
            lat: parseFloat(geoCoordinates.split(',')[0]),
            lon: parseFloat(geoCoordinates.split(',')[1])
          } : undefined
        },
        lastUpdated: Date.now()
      });

      setLastUpdateTime(Date.now());
    } catch (err: unknown) {
      console.error("Weather fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch weather data");
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, [settings, API_KEY, geoCoordinates, isRequestingGeo, getCityName]);

  // Geolocation effect
  useEffect(() => {
    if (settings?.useCurrentLocation) {
      setIsRequestingGeo(true);
      setError(null);
      
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
            setGeoCoordinates(null);
            setIsRequestingGeo(false);
            setLoading(false);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        setError("Geolocation not supported. Enter location manually.");
        setIsRequestingGeo(false);
        setLoading(false);
      }
    } else {
      setGeoCoordinates(null);
      setIsRequestingGeo(false);
    }
  }, [settings?.useCurrentLocation]);

  // Data fetching trigger
  useEffect(() => {
    if (settings?.useCurrentLocation && (isRequestingGeo || !geoCoordinates)) {
      if (!isRequestingGeo && !geoCoordinates && !error) {
        setError("Waiting for location data...");
      }
      setLoading(false);
      return;
    }
    fetchWeatherData();
  }, [settings?.location, settings?.units, settings?.useCurrentLocation, geoCoordinates, fetchWeatherData]);

  // Auto-refresh effect
  useEffect(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    if (weatherData && !loading && !error) {
      const intervalMinutes = settings?.updateInterval || 5;
      updateIntervalRef.current = setInterval(() => {
        fetchWeatherData();
      }, intervalMinutes * 60 * 1000);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [weatherData, loading, error, settings?.updateInterval, fetchWeatherData]);

  const unitSymbol = settings?.units === 'metric' ? '°C' : '°F';
  const speedUnit = settings?.units === 'metric' ? 'km/h' : 'mph';
  const currentCondition = weatherData ? getWeatherCondition(weatherData.current.weatherCode) : null;

  // Loading state
  if (isRequestingGeo && settings?.useCurrentLocation && !error) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl p-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full mb-4"
        />
        <motion.p variants={itemVariants} className="text-lg font-medium">
          Getting your location...
        </motion.p>
      </motion.div>
    );
  }

  if (loading && !error) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-xl p-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 rounded-full mb-4"
        />
        <motion.p variants={itemVariants} className="text-lg font-medium">
          Loading weather data...
        </motion.p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl p-6"
      >
        <motion.div variants={itemVariants} className="text-6xl mb-4">⚠️</motion.div>
        <motion.p variants={itemVariants} className="text-lg font-semibold mb-2">
          Weather Update Error
        </motion.p>
        <motion.p variants={itemVariants} className="text-sm text-center opacity-90 mb-4">
          {error}
        </motion.p>
        <motion.button
          variants={itemVariants}
          onClick={() => {
            setError(null);
            if (settings?.useCurrentLocation && !geoCoordinates) {
              setIsRequestingGeo(true);
            } else {
              fetchWeatherData();
            }
          }}
          className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  if (!weatherData) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800 text-white rounded-xl p-6"
      >
        <motion.p variants={itemVariants} className="text-lg">
          No weather data available
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`@container h-full relative overflow-hidden rounded-xl bg-gradient-to-br ${currentCondition?.bg || 'from-blue-500 to-purple-600'} text-white`}
    >
      {/* Weather Particles */}
      <WeatherParticles type={currentCondition?.particles || 'none'} />
      
      {/* Backdrop Blur Overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
      
      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col p-4 @sm:p-6">
        {/* Header with Location and Last Updated */}
        <motion.div variants={itemVariants} className="flex justify-between items-start mb-4 @compact:hidden">
          <div>
            <h2 className="text-xl @sm:text-2xl font-bold truncate">
              {weatherData.location.name}
            </h2>
            <p className="text-sm opacity-75">
              {currentCondition?.name}
            </p>
          </div>
          <div className="text-right text-xs opacity-60">
            <p>Updated</p>
            <p>{new Date(lastUpdateTime).toLocaleTimeString(undefined, { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}</p>
          </div>
        </motion.div>

        {/* Current Weather Display */}
        <div className="flex-1 flex flex-col justify-center">
          <motion.div variants={itemVariants} className="text-center mb-6">
            {/* Weather Icon */}
            <motion.div
              variants={temperatureVariants}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="text-8xl @sm:text-9xl mb-4 @micro:text-6xl"
            >
              {currentCondition?.emoji}
            </motion.div>

            {/* Temperature */}
            <motion.div variants={temperatureVariants} className="mb-4">
              <div className="text-6xl @sm:text-7xl font-light @micro:text-4xl">
                <AnimatedCounter 
                  value={Math.round(weatherData.current.temperature || 0)} 
                  duration={1500}
                />
                <span className="text-4xl @micro:text-2xl">{unitSymbol}</span>
              </div>
              {weatherData.current.temperatureApparent !== undefined && (
                <p className="text-lg opacity-80 @compact:hidden">
                  Feels like {Math.round(weatherData.current.temperatureApparent)}{unitSymbol}
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* Weather Details Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 @standard:grid-cols-4 @detailed:grid-cols-1 @full:grid-cols-4 gap-4 mb-6 @compact:hidden"
          >
            {weatherData.current.humidity !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">💧</div>
                <div className="text-sm opacity-75">Humidity</div>
                <div className="font-semibold">{Math.round(weatherData.current.humidity)}%</div>
              </div>
            )}
            
            {weatherData.current.windSpeed !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">💨</div>
                <div className="text-sm opacity-75">Wind</div>
                <div className="font-semibold">{Math.round(weatherData.current.windSpeed)} {speedUnit}</div>
              </div>
            )}
            
            {weatherData.current.uvIndex !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">☀️</div>
                <div className="text-sm opacity-75">UV Index</div>
                <div className="font-semibold">{Math.round(weatherData.current.uvIndex)}</div>
              </div>
            )}
            
            {weatherData.current.visibility !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">👁️</div>
                <div className="text-sm opacity-75">Visibility</div>
                <div className="font-semibold">{Math.round(weatherData.current.visibility)} km</div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Extended Forecast */}
        {settings?.showExtendedForecast && (
          <motion.div variants={itemVariants} className="mt-auto @standard:hidden">
            {/* View Toggle */}
            <div className="flex justify-center mb-4 @detailed:hidden">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 flex">
                {(['current', 'hourly', 'daily'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setCurrentView(view)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      currentView === view 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {view === 'current' ? 'Now' : view === 'hourly' ? '24h' : '7d'}
                  </button>
                ))}
              </div>
            </div>

            {/* Forecast Content */}
            <AnimatePresence mode="wait">
              {currentView === 'hourly' && (
                <motion.div
                  key="hourly"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="overflow-x-auto"
                >
                  <div className="flex space-x-4 pb-2">
                    {weatherData.hourly.slice(0, 12).map((hour) => (
                      <div
                        key={hour.time}
                        className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center min-w-[80px]"
                      >
                        <div className="text-xs opacity-75 mb-1">{hour.hour}</div>
                        <div className="text-2xl mb-1">
                          {getWeatherCondition(hour.weatherCode).emoji}
                        </div>
                        <div className="text-sm font-semibold">
                          {hour.temperature ? Math.round(hour.temperature) : '--'}{unitSymbol}
                        </div>
                        {hour.precipitationProbability !== undefined && (
                          <div className="text-xs opacity-60 mt-1">
                            {Math.round(hour.precipitationProbability)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentView === 'daily' && (
                <motion.div
                  key="daily"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2 @detailed:hidden"
                >
                  {weatherData.daily.slice(0, 5).map((day, index) => (
                    <div
                      key={day.time}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getWeatherCondition(day.weatherCode).emoji}
                        </div>
                        <div>
                          <div className="font-medium">
                            {index === 0 ? 'Today' : day.day}
                          </div>
                          <div className="text-xs opacity-75">
                            {getWeatherCondition(day.weatherCode).name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {day.temperatureMax ? Math.round(day.temperatureMax) : '--'}°
                          <span className="text-sm opacity-60 ml-1">
                            {day.temperatureMin ? Math.round(day.temperatureMin) : '--'}°
                          </span>
                        </div>
                        {day.precipitationProbability !== undefined && (
                          <div className="text-xs opacity-60">
                            {Math.round(day.precipitationProbability)}% rain
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        <div className="hidden @detailed:block">
          <AnimatePresence mode="wait">
            <motion.div
              key="hourly"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="overflow-x-auto"
            >
              <div className="flex space-x-4 pb-2">
                {weatherData.hourly.slice(0, 12).map((hour) => (
                  <div
                    key={hour.time}
                    className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center min-w-[80px]"
                  >
                    <div className="text-xs opacity-75 mb-1">{hour.hour}</div>
                    <div className="text-2xl mb-1">
                      {getWeatherCondition(hour.weatherCode).emoji}
                    </div>
                    <div className="text-sm font-semibold">
                      {hour.temperature ? Math.round(hour.temperature) : '--'}{unitSymbol}
                    </div>
                    {hour.precipitationProbability !== undefined && (
                      <div className="text-xs opacity-60 mt-1">
                        {Math.round(hour.precipitationProbability)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="hidden @full:block">
          <AnimatePresence mode="wait">
            <motion.div
              key="daily"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2"
            >
              {weatherData.daily.slice(0, 5).map((day, index) => (
                <div
                  key={day.time}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getWeatherCondition(day.weatherCode).emoji}
                    </div>
                    <div>
                      <div className="font-medium">
                        {index === 0 ? 'Today' : day.day}
                      </div>
                      <div className="text-xs opacity-75">
                        {getWeatherCondition(day.weatherCode).name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {day.temperatureMax ? Math.round(day.temperatureMax) : '--'}°
                      <span className="text-sm opacity-60 ml-1">
                        {day.temperatureMin ? Math.round(day.temperatureMin) : '--'}°
                      </span>
                    </div>
                    {day.precipitationProbability !== undefined && (
                      <div className="text-xs opacity-60">
                        {Math.round(day.precipitationProbability)}% rain
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes rain {
          0% { transform: translateY(-100vh) translateX(0); opacity: 1; }
          100% { transform: translateY(100vh) translateX(-20px); opacity: 0; }
        }
        @keyframes snow {
          0% { transform: translateY(-100vh) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) translateX(50px) rotate(360deg); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
        }
        .animate-rain { animation: rain linear infinite; }
        .animate-snow { animation: snow linear infinite; }
        .animate-float { animation: float ease-in-out infinite; }
      `}</style>
    </motion.div>
  );
};

export default WeatherWidget;
