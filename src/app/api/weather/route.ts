import { NextResponse } from 'next/server';

// Helper to fetch from a URL and parse JSON
async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API request failed with status ${response.status}: ${errorText}`);
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
}

// --- WeatherAPI.com Structures ---
interface WeatherApiCurrent {
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
        text: string;
        icon: string;
        code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
}

interface WeatherApiForecastDay {
    date: string;
    day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        maxwind_mph: number;
        maxwind_kph: number;
        totalprecip_mm: number;
        totalprecip_in: number;
        avgvis_km: number;
        avgvis_miles: number;
        avghumidity: number;
        daily_will_it_rain: number;
        daily_chance_of_rain: number;
        daily_will_it_snow: number;
        daily_chance_of_snow: number;
        condition: {
            text: string;
            icon: string;
            code: number;
        };
        uv: number;
    };
    astro: object;
    hour: WeatherApiHour[];
}

interface WeatherApiHour {
    time_epoch: number;
    time: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
        text: string;
        icon: string;
        code: number;
    };
    wind_mph: number;
    wind_kph: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    chance_of_rain: number;
    chance_of_snow: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
}

interface WeatherApiResponse {
    location: {
        name: string;
        region: string;
        country: string;
        lat: number;
        lon: number;
        tz_id: string;
        localtime_epoch: number;
        localtime: string;
    };
    current: WeatherApiCurrent;
    forecast: {
        forecastday: WeatherApiForecastDay[];
    };
}


// --- Tomorrow.io Structures ---
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

// --- Standardized Output Structure ---
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
    };
    hourly: {
        time: string;
        temperature?: number;
        weatherCode?: number | string;
        precipitationProbability?: number;
        windSpeed?: number;
    }[];
    daily: {
        time: string;
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
}

// --- Data Transformation Functions ---

function transformWeatherApiData(data: WeatherApiResponse, units: 'metric' | 'imperial'): StandardizedWeatherData {
    return {
        current: {
            temperature: units === 'imperial' ? data.current.temp_f : data.current.temp_c,
            temperatureApparent: units === 'imperial' ? data.current.feelslike_f : data.current.feelslike_c,
            weatherCode: data.current.condition.code,
            humidity: data.current.humidity,
            windSpeed: units === 'imperial' ? data.current.wind_mph : data.current.wind_kph,
            windDirection: data.current.wind_degree,
            uvIndex: data.current.uv,
            visibility: units === 'imperial' ? data.current.vis_miles : data.current.vis_km,
            pressure: units === 'imperial' ? data.current.pressure_in : data.current.pressure_mb,
            cloudCover: data.current.cloud,
        },
        hourly: data.forecast.forecastday[0].hour.map(h => ({
            time: h.time,
            temperature: units === 'imperial' ? h.temp_f : h.temp_c,
            weatherCode: h.condition.code,
            precipitationProbability: h.chance_of_rain,
            windSpeed: units === 'imperial' ? h.wind_mph : h.wind_kph,
        })),
        daily: data.forecast.forecastday.map(d => ({
            time: d.date,
            temperatureMin: units === 'imperial' ? d.day.mintemp_f : d.day.mintemp_c,
            temperatureMax: units === 'imperial' ? d.day.maxtemp_f : d.day.maxtemp_c,
            weatherCode: d.day.condition.code,
            precipitationProbability: d.day.daily_chance_of_rain,
            windSpeed: units === 'imperial' ? d.day.maxwind_mph : d.day.maxwind_kph,
            uvIndex: d.day.uv,
        })),
        location: {
            name: data.location.name,
            coordinates: { lat: data.location.lat, lon: data.location.lon },
        },
        dataSource: 'weatherapi',
    };
}

async function transformTomorrowData(
    location: string,
    units: 'metric' | 'imperial',
    apiKey: string
  ): Promise<StandardizedWeatherData> {
    const locationQueryParam = encodeURIComponent(location);
    const unitsQuery = units || 'imperial';
  
    const realtimeFields = "temperature,temperatureApparent,weatherCode,humidity,windSpeed,windDirection,uvIndex,visibility,pressure,cloudCover";
    const hourlyFields = "temperature,weatherCode,precipitationProbability,windSpeed";
    const dailyFields = "temperatureMin,temperatureMax,weatherCode,precipitationProbability,windSpeed,uvIndex";
  
    const [realtimeResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${locationQueryParam}&units=${unitsQuery}&apikey=${apiKey}&fields=${realtimeFields}`),
      fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${locationQueryParam}&timesteps=1h,1d&units=${unitsQuery}&apikey=${apiKey}&fields=${hourlyFields},${dailyFields}`)
    ]);
  
    if (!realtimeResponse.ok || !forecastResponse.ok) {
      throw new Error('Failed to fetch data from Tomorrow.io');
    }
  
    const realtimeData = await realtimeResponse.json();
    const forecastData = await forecastResponse.json();
  
    return {
      current: realtimeData.data.values,
      hourly: (forecastData.timelines?.hourly || []).map((item: TomorrowHourlyForecast) => ({
        ...item.values,
        time: item.time,
      })),
      daily: (forecastData.timelines?.daily || []).map((item: TomorrowDailyForecast) => ({
        ...item.values,
        time: item.time,
      })),
      location: {
        name: realtimeData.location.name,
        coordinates: {
          lat: realtimeData.location.lat,
          lon: realtimeData.location.lon,
        },
      },
      dataSource: 'tomorrow.io',
    };
  }

// --- Main API Route Handler ---
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const units = searchParams.get('units') as 'metric' | 'imperial' || 'imperial';

    if (!location) {
        return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    const weatherApiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    const tomorrowApiKey = process.env.NEXT_PUBLIC_TOMORROW_API_KEY;

    // --- Try WeatherAPI.com first ---
    if (weatherApiKey) {
        try {
            const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${location}&days=7&aqi=no&alerts=no`;
            const data = await fetchJson(url);
            const transformedData = transformWeatherApiData(data, units);
            return NextResponse.json(transformedData);
        } catch (error) {
            console.warn('WeatherAPI.com failed, falling back to Tomorrow.io:', error);
            // Fall through to Tomorrow.io
        }
    }

    // --- Fallback to Tomorrow.io ---
    if (tomorrowApiKey) {
        try {
            const data = await transformTomorrowData(location, units, tomorrowApiKey);
            return NextResponse.json(data);
        } catch (error) {
            console.error('Tomorrow.io also failed:', error);
            return NextResponse.json({ error: 'All weather providers failed' }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'No weather API keys configured' }, { status: 500 });
}
