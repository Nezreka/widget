"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

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

// --- Standardized Weather Data Structure ---
interface StandardizedWeatherData {
    current: {
        temperature?: number;
        temperatureApparent?: number;
        weatherCode?: number | string;
        humidity?: number;
        windSpeed?: number;
        windDirection?: number;
        uvIndex?: number;
        visibility?: number;
        pressure?: number;
        cloudCover?: number;
        isDay?: boolean;
    };
    hourly: {
        time: string;
        hour: string;
        temperature?: number;
        weatherCode?: number | string;
        precipitationProbability?: number;
        windSpeed?: number;
    }[];
    daily: {
        time: string;
        day: string;
        temperatureMin?: number;
        temperatureMax?: number;
        weatherCode?: number | string;
        precipitationProbability?: number;
        windSpeed?: number;
        uvIndex?: number;
    }[];
    location: {
        name: string;
        coordinates?: { lat: number; lon: number };
    };
    dataSource: 'weatherapi' | 'tomorrow.io';
    lastUpdated: number;
}

// Weather condition mappings with enhanced data
const WEATHER_CONDITIONS = {
  // Day
  1000: { day: { emoji: '☀️', name: 'Clear', bg: 'from-blue-400 to-cyan-300', particles: 'sun-rays' }, night: { emoji: '🌙', name: 'Clear', bg: 'from-gray-800 to-black', particles: 'stars' } },
  1100: { day: { emoji: '🌤️', name: 'Mostly Clear', bg: 'from-blue-300 to-cyan-200', particles: 'light-clouds' }, night: { emoji: '🌙', name: 'Mostly Clear', bg: 'from-gray-700 to-gray-900', particles: 'stars' } },
  1101: { day: { emoji: '⛅', name: 'Partly Cloudy', bg: 'from-sky-400 to-gray-400', particles: 'clouds' }, night: { emoji: '☁️', name: 'Partly Cloudy', bg: 'from-gray-600 to-gray-800', particles: 'light-clouds' } },
  1102: { day: { emoji: '☁️', name: 'Mostly Cloudy', bg: 'from-gray-400 to-gray-600', particles: 'heavy-clouds' }, night: { emoji: '☁️', name: 'Mostly Cloudy', bg: 'from-gray-500 to-gray-700', particles: 'heavy-clouds' } },
  1001: { day: { emoji: '☁️', name: 'Cloudy', bg: 'from-gray-500 to-gray-700', particles: 'overcast' }, night: { emoji: '☁️', name: 'Cloudy', bg: 'from-gray-600 to-gray-800', particles: 'overcast' } },
  // Rain
  4001: { day: { emoji: '🌧️', name: 'Rain', bg: 'from-blue-600 to-gray-700', particles: 'rain' }, night: { emoji: '🌧️', name: 'Rain', bg: 'from-blue-800 to-gray-900', particles: 'rain' } },
  4200: { day: { emoji: '🌧️', name: 'Light Rain', bg: 'from-blue-400 to-gray-500', particles: 'light-rain' }, night: { emoji: '🌧️', name: 'Light Rain', bg: 'from-blue-700 to-gray-800', particles: 'light-rain' } },
  4201: { day: { emoji: '⛈️', name: 'Heavy Rain', bg: 'from-blue-800 to-gray-900', particles: 'heavy-rain' }, night: { emoji: '⛈️', name: 'Heavy Rain', bg: 'from-blue-900 to-black', particles: 'heavy-rain' } },
  // Snow
  5000: { day: { emoji: '🌨️', name: 'Snow', bg: 'from-blue-200 to-gray-400', particles: 'snow' }, night: { emoji: '🌨️', name: 'Snow', bg: 'from-blue-300 to-gray-500', particles: 'snow' } },
  5100: { day: { emoji: '🌨️', name: 'Light Snow', bg: 'from-blue-200 to-gray-300', particles: 'light-snow' }, night: { emoji: '🌨️', name: 'Light Snow', bg: 'from-blue-300 to-gray-400', particles: 'light-snow' } },
  // Fog
  2000: { day: { emoji: '🌫️', name: 'Fog', bg: 'from-gray-300 to-gray-500', particles: 'fog' }, night: { emoji: '🌫️', name: 'Fog', bg: 'from-gray-500 to-gray-700', particles: 'fog' } },
  // Thunderstorm
  8000: { day: { emoji: '⛈️', name: 'Thunderstorm', bg: 'from-purple-600 to-gray-900', particles: 'thunderstorm' }, night: { emoji: '⛈️', name: 'Thunderstorm', bg: 'from-purple-800 to-black', particles: 'thunderstorm' } },
  // Default
  default: { day: { emoji: '🌡️', name: 'Unknown', bg: 'from-gray-400 to-gray-600', particles: 'none' }, night: { emoji: '🌡️', name: 'Unknown', bg: 'from-gray-700 to-gray-900', particles: 'none' } }
};

// Animation variants
const containerVariants: Variants = {
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

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const temperatureVariants: Variants = {
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
      {type === 'thunderstorm' && (
        <div className="absolute top-0 left-0 w-full h-full animate-lightning" />
      )}
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
  const [weatherData, setWeatherData] = useState<StandardizedWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoCoordinates, setGeoCoordinates] = useState<string | null>(null);
  const [isRequestingGeo, setIsRequestingGeo] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [currentView, setCurrentView] = useState<'current' | 'hourly' | 'daily'>('current');

  const updateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Get weather condition info
  const getWeatherCondition = (weatherCode?: number | string, isDay: boolean = true) => {
    const code = (typeof weatherCode === 'number' && weatherCode in WEATHER_CONDITIONS) ? weatherCode : 'default';
    const condition = WEATHER_CONDITIONS[code as keyof typeof WEATHER_CONDITIONS];
    return isDay ? condition.day : condition.night;
  };

  // Enhanced data fetching
  const fetchWeatherData = useCallback(async () => {
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
    
    const unitsQuery = settings?.units || 'imperial';
    
    try {
        const response = await fetch(`/api/weather?location=${encodeURIComponent(locationToQuery)}&units=${unitsQuery}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch weather data");
        }
        const data: StandardizedWeatherData = await response.json();

        // Post-process time/date formats for display
        const processedData = {
            ...data,
            hourly: data.hourly.map(h => ({
                ...h,
                hour: new Date(h.time).toLocaleTimeString(undefined, { hour: 'numeric', hour12: true }),
            })),
            daily: data.daily.map(d => ({
                ...d,
                day: new Date(d.time).toLocaleDateString(undefined, { weekday: 'short' }),
            })),
            lastUpdated: Date.now()
        };

        setWeatherData(processedData);
        setLastUpdateTime(Date.now());

    } catch (err: unknown) {
        console.error("Weather fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch weather data");
        setWeatherData(null);
    } finally {
        setLoading(false);
    }
  }, [settings, geoCoordinates, isRequestingGeo]);

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
  }, [settings?.location, settings?.units, settings?.useCurrentLocation, geoCoordinates, fetchWeatherData, error, isRequestingGeo]);

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
  const currentCondition = weatherData ? getWeatherCondition(weatherData.current.weatherCode, weatherData.current.isDay) : null;

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
            className="grid grid-cols-4 gap-2 mb-6 @compact:hidden"
          >
            {weatherData.current.humidity !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                <div className="text-xl mb-1">💧</div>
                <div className="text-xs opacity-75">Humidity</div>
                <div className="font-semibold text-sm">{Math.round(weatherData.current.humidity)}%</div>
              </div>
            )}
            
            {weatherData.current.windSpeed !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                <div className="text-xl mb-1">💨</div>
                <div className="text-xs opacity-75">Wind</div>
                <div className="font-semibold text-sm">{Math.round(weatherData.current.windSpeed)} {speedUnit}</div>
              </div>
            )}
            
            {weatherData.current.uvIndex !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                <div className="text-xl mb-1">☀️</div>
                <div className="text-xs opacity-75">UV Index</div>
                <div className="font-semibold text-sm">{Math.round(weatherData.current.uvIndex)}</div>
              </div>
            )}
            
            {weatherData.current.visibility !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                <div className="text-xl mb-1">👁️</div>
                <div className="text-xs opacity-75">Visibility</div>
                <div className="font-semibold text-sm">{Math.round(weatherData.current.visibility)} km</div>
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
                    {view === 'current' ? 'Now' : view === 'hourly' ? '24h' : '5d'}
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
                  className="overflow-x-auto"
                >
                  <div className="flex space-x-4 pb-2">
                    {weatherData.daily.slice(0, 7).map((day, index) => (
                      <div
                        key={day.time}
                        className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center min-w-[80px]"
                      >
                        <div className="text-xs opacity-75 mb-1">
                          {index === 0 ? 'Today' : day.day}
                        </div>
                        <div className="text-2xl mb-1">
                          {getWeatherCondition(day.weatherCode).emoji}
                        </div>
                        <div className="text-sm font-semibold">
                          {day.temperatureMax ? Math.round(day.temperatureMax) : '--'}°
                          <span className="opacity-60 ml-1">
                            {day.temperatureMin ? Math.round(day.temperatureMin) : '--'}°
                          </span>
                        </div>
                        {day.precipitationProbability !== undefined && (
                          <div className="text-xs opacity-60 mt-1">
                            {Math.round(day.precipitationProbability)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
        @keyframes lightning {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
        .animate-rain { animation: rain linear infinite; }
        .animate-snow { animation: snow linear infinite; }
        .animate-float { animation: float ease-in-out infinite; }
        .animate-lightning {
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%);
          animation: lightning 2s infinite;
        }
      `}</style>
    </motion.div>
  );
};

export default WeatherWidget;
