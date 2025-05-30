// src/components/GoogleCalendarWidget.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image'; // Import Next.js Image component

// Import custom types defined in your gapi.d.ts.
import type { GoogleCalendarEvent } from '@/types/gapi';

// Types for GAPI and Google Identity Services (like google.accounts.oauth2.TokenClient,
// google.accounts.oauth2.TokenResponse, google.accounts.oauth2.ClientConfigError)
// are now expected to be globally available via the /// <reference types="..." />
// in gapi.d.ts and the component files, and through the installed @types packages.

export interface GoogleCalendarWidgetSettings {
  viewMode?: 'month' | 'week' | 'day';
  showWeekends?: boolean;
  calendarId?: string;
}

interface GoogleCalendarWidgetProps {
  settings?: GoogleCalendarWidgetSettings;
}

// Ensure these are set in your .env.local or environment variables
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/userinfo.profile";


// Google's Material Design Event Colors - Revamped for a Dark Theme with Vibrant Accents
const GOOGLE_EVENT_COLORS_DARK_THEME: { [key: string]: { cardBg: string; text: string; border: string; dot: string } } = {
  '1': { cardBg: 'bg-sky-500/10 hover:bg-sky-500/20', text: 'text-sky-200', border: 'border-sky-400', dot: 'bg-sky-400' },
  '2': { cardBg: 'bg-emerald-500/10 hover:bg-emerald-500/20', text: 'text-emerald-200', border: 'border-emerald-400', dot: 'bg-emerald-400' },
  '3': { cardBg: 'bg-purple-500/10 hover:bg-purple-500/20', text: 'text-purple-200', border: 'border-purple-400', dot: 'bg-purple-400' },
  '4': { cardBg: 'bg-rose-500/10 hover:bg-rose-500/20', text: 'text-rose-200', border: 'border-rose-400', dot: 'bg-rose-400' },
  '5': { cardBg: 'bg-amber-500/10 hover:bg-amber-500/20', text: 'text-amber-200', border: 'border-amber-400', dot: 'bg-amber-400' },
  '6': { cardBg: 'bg-orange-500/10 hover:bg-orange-500/20', text: 'text-orange-200', border: 'border-orange-400', dot: 'bg-orange-400' },
  '7': { cardBg: 'bg-cyan-500/10 hover:bg-cyan-500/20', text: 'text-cyan-200', border: 'border-cyan-400', dot: 'bg-cyan-400' },
  '8': { cardBg: 'bg-slate-600/20 hover:bg-slate-600/30', text: 'text-slate-200', border: 'border-slate-400', dot: 'bg-slate-400' },
  '9': { cardBg: 'bg-indigo-500/10 hover:bg-indigo-500/20', text: 'text-indigo-200', border: 'border-indigo-400', dot: 'bg-indigo-400' },
  '10': { cardBg: 'bg-teal-500/10 hover:bg-teal-500/20', text: 'text-teal-200', border: 'border-teal-400', dot: 'bg-teal-400' },
  '11': { cardBg: 'bg-pink-500/10 hover:bg-pink-500/20', text: 'text-pink-200', border: 'border-pink-400', dot: 'bg-pink-400' },
  'default': { cardBg: 'bg-sky-500/10 hover:bg-sky-500/20', text: 'text-sky-200', border: 'border-sky-400', dot: 'bg-sky-400' },
};

// --- Icon Components ---

// The type GoogleCalendarEvent is imported from '@/types/gapi'
type CalendarEventListItems = GoogleCalendarEvent[];


// Updated EventIndicator to show a triangle in the bottom-right corner with event count
const EventIndicator: React.FC<{ eventsOnDay: CalendarEventListItems }> = ({ eventsOnDay }) => {
  if (!eventsOnDay || eventsOnDay.length === 0) return null;

  // Assuming GoogleCalendarEvent has a colorId property
  const firstEventColorId = eventsOnDay[0].colorId || 'default';
  const triangleBgColorClass = GOOGLE_EVENT_COLORS_DARK_THEME[firstEventColorId]?.dot || GOOGLE_EVENT_COLORS_DARK_THEME['default'].dot;
  const eventCount = eventsOnDay.length;

  const triangleStyle: React.CSSProperties = {
    clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)',
  };

  return (
    <div
      className={`absolute bottom-0 right-0 w-[22%] h-[22%] z-10 ${triangleBgColorClass}`}
      style={triangleStyle}
      aria-label={`${eventCount} event${eventCount !== 1 ? 's' : ''}`}
      role="img"
    >
      <span
        className="absolute bottom-0 right-0 leading-none font-bold text-white pr-[2px] pb-[1px]"
        style={{ fontSize: '8px', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}
      >
        {eventCount > 9 ? '9+' : eventCount}
      </span>
    </div>
  );
};

const GoogleCalendarDynamicIcon: React.FC<{ className?: string, date?: number, isSignInPage?: boolean }> = ({ className = "w-6 h-6", date, isSignInPage = false }) => (
  <svg className={className} viewBox="0 0 36 36" aria-hidden="true">
    <defs>
        <linearGradient id="gradBlueCal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{stopColor: '#4285F4', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#2962FF', stopOpacity: 1}} /></linearGradient>
        <linearGradient id="gradGreenCal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{stopColor: '#34A853', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#1E8E3E', stopOpacity: 1}} /></linearGradient>
        <linearGradient id="gradYellowCal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{stopColor: '#FBBC05', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#F9AB00', stopOpacity: 1}} /></linearGradient>
        <linearGradient id="gradRedCal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{stopColor: '#EA4335', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#D93025', stopOpacity: 1}} /></linearGradient>
    </defs>
    <path fill="url(#gradGreenCal)" d="M16 0H2C.9 0 0 .9 0 2v14h18V2c0-1.1-.9-2-2-2z" />
    <path fill="url(#gradBlueCal)" d="M0 16h18v14c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V16z" />
    <path fill="url(#gradYellowCal)" d="M16 32h14c1.1 0 2-.9 2-2V16H16v16z" />
    <path fill="url(#gradRedCal)" d="M32 0H16v16h18V2c0-1.1-.9-2-2-2z" />
    {date && (
        <text x="50%" y={isSignInPage ? "54%" : "53%"} dominantBaseline="middle" textAnchor="middle" fontSize={isSignInPage ? "20" : "17"} fill="#fff" fontWeight="600" fontFamily="Roboto, Inter, sans-serif">
            {date}
        </text>
    )}
  </svg>
);

const ChevronLeftIcon: React.FC<{className?: string}> = ({className="w-5 h-5"}) => <svg aria-hidden="true" className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const ChevronRightIcon: React.FC<{className?: string}> = ({className="w-5 h-5"}) => <svg aria-hidden="true" className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const LocationPinIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <svg aria-hidden="true" className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;
const ClockIcon: React.FC<{className?: string}> = ({className="w-4 h-4"}) => <svg aria-hidden="true" className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SignOutIcon: React.FC<{className?: string}> = ({className="w-5 h-5"}) => <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>;
const CloseIcon: React.FC<{className?: string}> = ({className="w-5 h-5"}) => <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;
const CalendarDaysIcon: React.FC<{className?: string}> = ({className="w-5 h-5"}) => <svg aria-hidden="true" className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>;


// --- Main Widget Component ---
const GoogleCalendarWidget: React.FC<GoogleCalendarWidgetProps> = ({ settings }) => {
  const [gapiReady, setGapiReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [events, setEvents] = useState<CalendarEventListItems>([]);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEventListItems>([]);

  // Use the standard google.accounts.oauth2.TokenClient type
  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);


  const getEventColorStyles = (colorId?: string) => {
    return GOOGLE_EVENT_COLORS_DARK_THEME[colorId || 'default'] || GOOGLE_EVENT_COLORS_DARK_THEME['default'];
  };

  const currentSettings = {
    viewMode: settings?.viewMode || 'month',
    showWeekends: settings?.showWeekends !== undefined ? settings.showWeekends : true,
    calendarId: settings?.calendarId || 'primary',
  };

  useEffect(() => {
    const scriptGapi = document.createElement('script');
    scriptGapi.src = 'https://apis.google.com/js/api.js';
    scriptGapi.async = true; scriptGapi.defer = true;
    scriptGapi.onload = () => { if (window.gapi) window.gapi.load('client', () => setGapiReady(true)); };
    scriptGapi.onerror = () => { setError("Failed to load Google API script. Check network or ad-blockers."); setIsLoading(false); }
    document.body.appendChild(scriptGapi);
    return () => { if (document.body.contains(scriptGapi)) document.body.removeChild(scriptGapi); };
  }, []);

  useEffect(() => {
    const scriptGis = document.createElement('script');
    scriptGis.src = 'https://accounts.google.com/gsi/client';
    scriptGis.async = true; scriptGis.defer = true;
    scriptGis.onload = () => setGisReady(true);
    scriptGis.onerror = () => { setError("Failed to load Google Identity Services. Check network or ad-blockers."); setIsLoading(false); }
    document.body.appendChild(scriptGis);
    return () => { if (document.body.contains(scriptGis)) document.body.removeChild(scriptGis); };
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!window.gapi?.client?.oauth2?.userinfo) {
        console.warn("GAPI oauth2.userinfo not available for fetching profile.");
        return;
    }
    setIsLoadingProfile(true);
    try {
      const response = await window.gapi.client.oauth2.userinfo.get();
      if (response?.result) {
        setUserName(response.result.name || response.result.email || 'User');
        setUserImage(response.result.picture || null);
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
      if (!userName) setUserName('User'); 
    } finally {
      setIsLoadingProfile(false);
    }
  }, [userName]); 

  const initializeGapiClientAndTokenClient = useCallback(async () => {
    if (!CLIENT_ID) { setError("Configuration Error: Google Client ID is missing. Please check your environment variables (NEXT_PUBLIC_GOOGLE_CLIENT_ID)."); setIsLoading(false); return; }
    if (!API_KEY) { setError("Configuration Error: Google API Key is missing. Please check your environment variables (NEXT_PUBLIC_GOOGLE_API_KEY)."); setIsLoading(false); return; }

    setIsLoading(true);
    try {
      if (!window.gapi || !window.gapi.client) {
          setError("GAPI client not loaded. Cannot initialize.");
          setIsLoading(false);
          return;
      }
      await window.gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS });
      await window.gapi.client.load('calendar', 'v3');
      await window.gapi.client.load('oauth2', 'v2'); 

    } catch (e: unknown) {
        const error = e as Error;
        setError(`API Initialization Error: ${error.message || 'Unknown error during API init.'}`);
        setIsLoading(false); return;
    }

    try {
      if (window.google?.accounts?.oauth2) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID, scope: SCOPES,
          callback: (tokenResponse: google.accounts.oauth2.TokenResponse) => { 
            if (tokenResponse.access_token && window.gapi?.client) { // Check for access_token directly
              window.gapi.client.setToken({ access_token: tokenResponse.access_token });
              setIsSignedIn(true);
              setError(null);
              fetchUserProfile();
            } else if (tokenResponse.error) { // Check for error property
              // Error information is within the TokenResponse object
              const errorDesc = tokenResponse.error_description;
              setError(`Authentication Error: ${errorDesc || tokenResponse.error}`);
              setIsSignedIn(false);
            } else {
              // Fallback for unexpected structure, though GIS usually provides access_token or error
              setError("Authentication failed: Unexpected response structure.");
              setIsSignedIn(false);
            }
            setIsLoading(false);
          },
          error_callback: (errorResponse: google.accounts.oauth2.ClientConfigError) => { 
            let msg = 'Authentication Failed.';
            // Check for more specific error types if needed, e.g. PopupClosedError
            if (errorResponse?.type === 'popup_closed') {
                 msg = 'Sign-in popup was closed before completing authentication.';
            } else if (errorResponse?.type === 'popup_failed_to_open') {
                 msg = 'Sign-in popup failed to open. Please disable popup blockers for this site.';
            } else if ('message' in errorResponse && typeof (errorResponse as {message: string}).message === 'string') {
                 msg = `${errorResponse.type ? errorResponse.type + ': ' : ''}${(errorResponse as {message: string}).message}`;
            } else if (errorResponse?.type) {
                 msg = errorResponse.type;
            }
            setError(msg); setIsSignedIn(false); setIsLoading(false);
          }
        });
        
        if (window.gapi?.client?.getToken && window.gapi.client.getToken()) {
           setIsSignedIn(true);
           fetchUserProfile(); 
        } else {
           setIsSignedIn(false);
        }
      } else {
        setError("Google Identity Services (accounts.oauth2) not available on window.google object.");
        setIsLoading(false);
        return;
      }
    } catch (e: unknown) {
        const error = e as Error;
        setError(`Sign-In Initialization Error: ${error.message || 'Unknown error during sign-in init.'}`);
        setIsLoading(false); return;
    }
    setIsLoading(false);
  }, [fetchUserProfile]); 

  useEffect(() => {
    if (gapiReady && gisReady) {
      initializeGapiClientAndTokenClient();
    }
  }, [gapiReady, gisReady, initializeGapiClientAndTokenClient]);

  const handleSignIn = () => {
    if (!tokenClientRef.current) {
      setError("Sign-In service is not ready. Please wait a moment or refresh the page.");
      setIsLoading(false); return;
    }
    setIsLoading(true);
    setError(null);
    tokenClientRef.current.requestAccessToken({ prompt: 'consent' }); 
  };

  const handleSignOut = () => {
    setIsLoading(true);
    const token = window.gapi?.client?.getToken ? window.gapi.client.getToken() : null;
    const callback = () => {
      if(window.gapi?.client) window.gapi.client.setToken(null); 
      setIsSignedIn(false); setEvents([]); setError(null);
      setUserName(null); setUserImage(null);
      setIsLoading(false); setSelectedDate(null); setSelectedDateEvents([]);
      if(window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect(); 
    };

    if (token?.access_token && window.google?.accounts?.oauth2?.revoke) {
      window.google.accounts.oauth2.revoke(token.access_token, callback);
    } else {
      callback();
    }
  };

  const listMonthEvents = useCallback(async (dateForMonth: Date) => {
    if (!isSignedIn || !window.gapi?.client?.calendar?.events) {
      setEvents([]); 
      return;
    }
    setError(null); setIsLoadingEvents(true);
    const firstDay = new Date(dateForMonth.getFullYear(), dateForMonth.getMonth(), 1);
    const lastDay = new Date(dateForMonth.getFullYear(), dateForMonth.getMonth() + 1, 0, 23, 59, 59);

    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: currentSettings.calendarId,
        timeMin: firstDay.toISOString(),
        timeMax: lastDay.toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 250, 
        orderBy: 'startTime'
      });
      setEvents(response.result.items || []);
    } catch (e: unknown) {
      let msg = `Event Fetch Error: An unknown error occurred.`;
      const errorResult = (e as { result?: { error?: { message?: string; status?: string; code?: number } } })?.result?.error;
      if (errorResult?.message) {
        msg = `Event Fetch Error: ${errorResult.message}`;
      } else if ((e as Error)?.message) {
        msg = `Event Fetch Error: ${(e as Error).message}`;
      }

      if ((errorResult?.status === 'INVALID_ARGUMENT' || errorResult?.status === 'NOT_FOUND') && currentSettings.calendarId !== 'primary') {
         msg = `Calendar ID '${currentSettings.calendarId}' was not found or is invalid. Please check the ID or use 'primary'.`;
      } else if (errorResult?.code === 401 ) { 
        msg = "Authentication error. Please try signing out and signing back in.";
      }
      setError(msg); setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [isSignedIn, currentSettings.calendarId]);

  useEffect(() => {
    if (isSignedIn && gapiReady && gisReady && window.gapi?.client?.calendar) {
      listMonthEvents(currentMonthDate);
    } else if (!isSignedIn) {
      setEvents([]); 
    }
  }, [isSignedIn, gapiReady, gisReady, currentMonthDate, listMonthEvents]);


  const generateCalendarGrid = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayOfMonthStart = new Date(year, month, 1).getDay(); 
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const grid: { day: number; monthType: 'prev' | 'current' | 'next'; date: Date, events: CalendarEventListItems }[] = [];

    for (let i = 0; i < firstDayOfMonthStart; i++) {
      grid.push({ day: daysInPrevMonth - firstDayOfMonthStart + 1 + i, monthType: 'prev', date: new Date(year, month - 1, daysInPrevMonth - firstDayOfMonthStart + 1 + i), events: [] });
    }
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateCell = new Date(year, month, day);
      const dayEvents = events.filter(event => {
        const isAllDayEvent = !!event.start?.date && !event.start?.dateTime;
        let eventStartDate: Date;

        if (isAllDayEvent && event.start.date) {
            const [yearStr, monthStr, dayStr] = event.start.date.split('-');
            eventStartDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
        } else if (event.start?.dateTime) {
            eventStartDate = new Date(event.start.dateTime);
        } else {
            return false;
        }
        return eventStartDate.getFullYear() === dateCell.getFullYear() &&
               eventStartDate.getMonth() === dateCell.getMonth() &&
               eventStartDate.getDate() === dateCell.getDate();
      });
      grid.push({ day, monthType: 'current', date: dateCell, events: dayEvents });
    }
    const totalCells = Math.max(35, Math.ceil(grid.length / 7) * 7); 
    const remainingCells = Math.max(totalCells, 42) - grid.length; 
    for (let i = 1; i <= remainingCells; i++) {
      grid.push({ day: i, monthType: 'next', date: new Date(year, month + 1, i), events: [] });
    }
    return grid;
  };


  const calendarGrid = isSignedIn ? generateCalendarGrid() : [];
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"]; 

  const handleDayClick = (date: Date, dayEvents: CalendarEventListItems) => {
    setSelectedDate(date);
    setSelectedDateEvents(dayEvents);
  };

  const changeMonth = (offset: number) => {
    setSelectedDate(null); setSelectedDateEvents([]); 
    setCurrentMonthDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); 
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    const todayEvents = events.filter(event => {
        const isAllDayEvent = !!event.start?.date && !event.start?.dateTime;
        let eventStartDate: Date;
        if (isAllDayEvent && event.start.date) {
            const [yearStr, monthStr, dayStr] = event.start.date.split('-');
            eventStartDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
        } else if (event.start?.dateTime) {
            eventStartDate = new Date(event.start.dateTime);
        } else { return false; } 
        return eventStartDate.getFullYear() === today.getFullYear() &&
               eventStartDate.getMonth() === today.getMonth() &&
               eventStartDate.getDate() === today.getDate();
    });
    handleDayClick(today, todayEvents); 
  };


  const renderContent = () => {
    const googleSignInButtonClasses = "bg-white hover:bg-gray-100 text-slate-700 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-800 font-medium py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-850 transition-all duration-150 ease-in-out disabled:opacity-70 group flex items-center justify-center transform active:scale-95 hover:scale-[1.02]";

    if (isLoading && !error && (!gapiReady || !gisReady || (gapiReady && gisReady && !tokenClientRef.current && !isSignedIn))) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4" aria-live="polite" aria-busy="true">
            <svg className="animate-spin h-10 w-10 text-sky-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
            <p className="text-sm"> {(!gapiReady || !gisReady) ? "Loading Google services..." : "Initializing authentication..."} </p>
          </div>
        );
    }
    if (error) {
        return (
          <div className="text-sm text-rose-400 p-5 m-4 rounded-lg bg-rose-500/10 border border-rose-500/30 w-auto max-w-md mx-auto text-center shadow-lg" role="alert" aria-live="assertive">
            <h3 className="font-semibold text-base mb-2 text-rose-300">An Error Occurred</h3>
            <p className="mb-3">{error}</p>
            {(!CLIENT_ID || !API_KEY) && <p className="mb-3 text-xs font-semibold">Crucial configuration (Client ID/API Key) might be missing. Please contact support or check environment variables.</p>}
            {(error.includes("popup") || error.includes("Auth Error") || error.includes("Sign-In not ready") || error.includes("Failed to load") || error.includes("Authentication Error") || error.includes("Authentication Failed")) && (
              <button onClick={handleSignIn} disabled={!tokenClientRef.current || isLoading} className={`${googleSignInButtonClasses} mt-2 text-sm`}> Retry Sign In </button>
            )}
          </div>
        );
    }
    if (!tokenClientRef.current && !isLoading && !isSignedIn) { 
        return (
          <div className="text-sm text-amber-400 p-5 m-4 rounded-lg bg-amber-500/10 border border-amber-500/30 w-auto max-w-md mx-auto text-center shadow-lg" role="alert" aria-live="assertive">
            <h3 className="font-semibold text-base mb-2 text-amber-300">Initialization Issue</h3>
            <p>Could not initialize Google Sign-In. This might be due to network issues, browser settings (like popup blockers or third-party cookie restrictions if not using popups), or a problem with Google&apos;s services. Please try refreshing the page or check your browser&apos;s console for more details.</p>
          </div>
        );
    }

    if (!isSignedIn) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-8 bg-slate-800 dark:bg-slate-850 rounded-lg">
          <div className="mb-8 sm:mb-10 transform scale-110 sm:scale-125">
            <GoogleCalendarDynamicIcon
              className="w-32 h-32 sm:w-36 sm:h-36 text-sky-500 drop-shadow-xl"
              date={new Date().getDate()}
              isSignInPage={true}
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-50 dark:text-white">
            Google Calendar
          </h1>
          <p className="text-base sm:text-lg text-slate-300 dark:text-slate-400 mb-8 sm:mb-10 max-w-md mx-auto">
            Connect your Google Calendar to view and manage your events directly on your dashboard.
          </p>
          <button
            onClick={handleSignIn}
            disabled={!tokenClientRef.current || isLoading} 
            className={googleSignInButtonClasses}
            aria-label="Sign In with Google"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-3" aria-hidden="true" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            <span className="text-sm sm:text-base">{isLoading ? "Signing In..." : "Sign In with Google"}</span>
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-600 mt-10 sm:mt-12">
            By signing in, you agree to our terms of service.
          </p>
        </div>
      );
    }

    // Signed In View
    return (
      <div className="w-full h-full flex flex-col bg-slate-800 dark:bg-slate-900 rounded-lg overflow-hidden font-['Inter',_sans-serif] text-slate-300">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-700 dark:border-slate-700/70">
          <div className="flex items-center">
            <GoogleCalendarDynamicIcon className="w-10 h-10 mr-3 flex-shrink-0" date={new Date().getDate()} />
            <h2 className="text-lg md:text-xl font-semibold text-slate-100 dark:text-slate-50 tracking-tight">
              {currentMonthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button onClick={goToToday} title="Go to Today" aria-label="Go to Today" className="p-2 sm:p-2.5 rounded-full hover:bg-slate-700 dark:hover:bg-slate-600/50 text-slate-400 hover:text-slate-200 transition-colors"> <CalendarDaysIcon className="w-5 h-5 sm:w-6 sm:h-6"/> </button>
            <button onClick={() => changeMonth(-1)} title="Previous month" aria-label="Previous month" className="p-2 sm:p-2.5 rounded-full hover:bg-slate-700 dark:hover:bg-slate-600/50 text-slate-400 hover:text-slate-200 transition-colors"> <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6"/> </button>
            <button onClick={() => changeMonth(1)} title="Next month" aria-label="Next month" className="p-2 sm:p-2.5 rounded-full hover:bg-slate-700 dark:hover:bg-slate-600/50 text-slate-400 hover:text-slate-200 transition-colors"> <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6"/> </button>
            <div className="w-px h-6 bg-slate-600 dark:bg-slate-700 mx-1 sm:mx-2"></div>
            {isLoadingProfile ? (
                <div className="w-9 h-9 flex items-center justify-center ml-1 sm:ml-2" aria-label="Loading user profile">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-75 mx-0.5"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                </div>
            ) : userImage ? (
                <Image src={userImage} alt={userName || 'User profile picture'} title={`Signed in as ${userName || 'User'}`} width={36} height={36} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ml-1 sm:ml-2 shadow-md object-cover border-2 border-slate-600"/>
            ) : userName ? (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm sm:text-base font-semibold ml-1 sm:ml-2 shadow-md border-2 border-sky-700" title={`Signed in as ${userName}`}>{userName.charAt(0).toUpperCase()}</div>
            ) : null}
            <button onClick={handleSignOut} title="Sign Out" aria-label="Sign Out" className="p-2 sm:p-2.5 rounded-full hover:bg-slate-700 dark:hover:bg-slate-600/50 text-slate-400 hover:text-slate-200 transition-colors"> <SignOutIcon className="w-5 h-5 sm:w-6 sm:h-6"/> </button>
          </div>
        </div>

        {/* Main Content Area (Calendar Grid and Event Details) */}
        <div className={`flex flex-grow overflow-hidden transition-all duration-300 ease-in-out ${selectedDate ? 'flex-col md:flex-row' : 'flex-col'}`}>
          {/* Calendar Grid */}
          <div className={`flex-grow flex flex-col p-3 md:p-4 transition-all duration-300 ease-in-out ${selectedDate ? 'md:w-[65%] lg:w-[70%]' : 'w-full'}`}>
            <div className="grid grid-cols-7 gap-x-1 md:gap-x-2 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2.5">
              {weekdays.map((day, index) => <div key={`${day}-${index}`} className="py-1.5" aria-hidden="true">{day}</div>)}
            </div>
            {isLoadingEvents && !events.length && !error ? (
                <div className="flex-grow flex items-center justify-center text-slate-500" aria-live="polite" aria-busy="true">
                    <svg className="animate-spin h-7 w-7 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
                    <span className="ml-2 text-sm">Loading events...</span>
                </div>
            ) : (
            <div className="grid grid-cols-7 grid-rows-6 gap-1.5 md:gap-2 flex-grow">
              {calendarGrid.map((cell, index) => {
                const isToday = cell.monthType === 'current' && new Date().toDateString() === cell.date.toDateString();
                const isSelected = selectedDate?.toDateString() === cell.date.toDateString();
                const cellDateStr = cell.date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                return (
                  <button
                    key={`${cell.monthType}-${cell.day}-${index}`}
                    onClick={() => cell.monthType === 'current' && handleDayClick(cell.date, cell.events)}
                    disabled={cell.monthType !== 'current'}
                    aria-label={`${cellDateStr}${cell.monthType === 'current' ? `, ${cell.events.length} event${cell.events.length !== 1 ? 's' : ''}` : ''}${isSelected ? ', Selected' : ''}${isToday ? ', Today' : ''}`}
                    className={`h-full w-full relative group flex flex-col items-center justify-start pt-2 pb-1 px-1 rounded-lg transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-900 focus:z-10 transform hover:scale-[1.03] focus:scale-[1.03]
                      ${cell.monthType === 'current' ? 'bg-slate-700 dark:bg-slate-800/70 hover:bg-slate-600 dark:hover:bg-slate-700' : 'bg-slate-750/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-600 cursor-default hover:scale-100'}
                      ${isSelected ? 'bg-slate-600 dark:bg-slate-700 ring-2 ring-sky-400 dark:ring-sky-500 shadow-xl' : ''}
                      ${!isSelected && isToday ? 'bg-slate-650 dark:bg-slate-750 shadow-md' : ''}
                    `}
                  >
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150
                      ${isSelected ? 'bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-900 shadow-md' :
                       isToday ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-50 shadow-md' :
                       (cell.monthType === 'current' ? 'text-slate-200 dark:text-slate-100 group-hover:text-white' : 'text-slate-500 dark:text-slate-600')}
                    `}>
                      {cell.day}
                    </span>
                    {cell.monthType === 'current' && cell.events.length > 0 && <EventIndicator eventsOnDay={cell.events} />}
                  </button>
                );
              })}
            </div>
            )}
          </div>

          {/* Event Details Panel */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedDate ? 'w-full md:w-[35%] lg:w-[30%] opacity-100' : 'w-0 opacity-0 md:w-0'}`} aria-live="polite" aria-busy={isLoadingEvents && !!selectedDate}>
            {selectedDate && (
            <div className={`h-full border-l border-slate-700 dark:border-slate-600/50 flex flex-col bg-slate-750 dark:bg-slate-850 p-4 md:p-5 animate-slideInFromRightImproved`}>
              <div className="flex items-start justify-between mb-3.5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 dark:text-slate-50">
                    {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
                  </h3>
                  <p className="text-5xl font-bold text-sky-400 dark:text-sky-300 -mt-1">
                    {selectedDate.getDate()}
                  </p>
                </div>
                <button
                  onClick={() => {setSelectedDate(null); setSelectedDateEvents([]);}}
                  className="p-2 rounded-full text-slate-400 hover:bg-slate-600 dark:hover:bg-slate-700 hover:text-slate-200 transition-colors"
                  title="Close details" aria-label="Close event details panel"
                > <CloseIcon className="w-6 h-6"/> </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 -mt-2.5">
                {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </p>
              <div className="flex-grow overflow-y-auto space-y-3 custom-scrollbar-gcal pr-1.5 -mr-2.5">
                {isLoadingEvents && <div className="flex justify-center items-center h-24" aria-label="Loading events for selected day"><svg className="animate-spin h-6 w-6 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg></div>}
                {!isLoadingEvents && selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event, idx) => {
                    const { cardBg, text, border: borderColorClass } = getEventColorStyles(event.colorId);
                    const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : (event.start?.date ? new Date(event.start.date + "T00:00:00") : null); 
                    const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : (event.end?.date ? new Date(new Date(event.end.date + "T00:00:00").getTime() -1) : null); 
                    const isAllDay = !event.start?.dateTime;

                    return (
                    <a href={event.htmlLink || '#'} target="_blank" rel="noopener noreferrer"
                       key={event.id || `event-${idx}`}
                       className={`block p-3.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-out animate-fadeIn ${cardBg} ${text} border-l-4 ${borderColorClass}`}
                       style={{animationDelay: `${idx * 70}ms`}}
                       title={`View event: ${event.summary || 'Calendar Event'}`}
                       aria-label={`Event: ${event.summary || "(No Title)"}. Time: ${isAllDay ? "All day" : `${startTime?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}`}${event.location ? `. Location: ${event.location}` : ''}. Opens in new tab.`}
                    >
                      <h5 className="text-sm font-semibold leading-tight mb-1.5">{event.summary || "(No Title)"}</h5>
                      <div className="text-xs opacity-90 flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2 opacity-75 flex-shrink-0"/>
                        {isAllDay ? "All day" :
                          `${startTime?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endTime?.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}`
                        }
                      </div>
                      {event.location && <div className="text-xs opacity-90 mt-2 flex items-center">
                          <LocationPinIcon className="w-4 h-4 mr-2 opacity-75 flex-shrink-0"/> {event.location}
                      </div>}
                    </a>
                  )})
                ) : (
                  !isLoadingEvents &&
                  <div className="text-sm text-slate-400 dark:text-slate-400 mt-4 text-center py-10 bg-slate-700/40 dark:bg-slate-800/50 rounded-lg flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-500 mb-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.008v.008H12v-.008z" />
                    </svg>
                    No events scheduled for this day.
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 w-full h-full flex flex-col items-center justify-center bg-slate-800 dark:bg-slate-900 text-slate-300 rounded-lg border border-slate-700 dark:border-slate-700/80 shadow-2xl font-['Inter',_sans-serif]">
      {renderContent()}
       <style jsx global>{`
        :root {
            --scrollbar-thumb-light: rgba(100, 116, 139, 0.5);
            --scrollbar-thumb-hover-light: rgba(100, 116, 139, 0.7);
            --scrollbar-thumb-dark: rgba(71, 85, 105, 0.6);
            --scrollbar-thumb-hover-dark: rgba(71, 85, 105, 0.8);
        }
        .custom-scrollbar-gcal::-webkit-scrollbar { width: 7px; height: 7px; }
        .custom-scrollbar-gcal::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-gcal::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb-dark); border-radius: 10px; }
        .dark .custom-scrollbar-gcal::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb-dark); }
        .custom-scrollbar-gcal::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover-dark); }
        .dark .custom-scrollbar-gcal::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover-dark); }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out forwards; }

        @keyframes slideInFromRightImproved {
          from { opacity: 0; transform: translateX(25px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideInFromRightImproved { animation: slideInFromRightImproved 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }

        /* Custom background colors for calendar cells if needed */
        .bg-slate-650 { background-color: #475569; } /* For Today if not selected */
        .dark .bg-slate-750 { background-color: #293344; } /* For Today if not selected in dark mode */
        .bg-slate-750 { background-color: #334155; } /* For event details panel in light mode */
       `}</style>
    </div>
  );
};

export const GoogleCalendarSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: GoogleCalendarWidgetSettings | undefined;
  onSave: (newSettings: GoogleCalendarWidgetSettings) => void;
}> = ({ currentSettings: initialSettings, onSave, widgetId }) => {
  const [viewMode, setViewMode] = React.useState(initialSettings?.viewMode || 'month');
  const [showWeekends, setShowWeekends] = React.useState(initialSettings?.showWeekends !== undefined ? initialSettings.showWeekends : true);
  const [calendarId, setCalendarId] = React.useState(initialSettings?.calendarId || 'primary');

  const handleSave = () => {
    onSave({
        viewMode: viewMode as 'month'|'week'|'day',
        showWeekends,
        calendarId: calendarId.trim() === '' ? 'primary' : calendarId.trim()
    });
  };

  const commonInputClass = "mt-1 block w-full px-3.5 py-2.5 bg-slate-700 dark:bg-slate-600 border border-slate-500 dark:border-slate-500 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-400";
  const commonLabelClass = "block text-sm font-medium text-slate-300 dark:text-slate-200 mb-1";
  const commonButtonClass = "w-full px-4 py-2.5 text-sm font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-150 ease-in-out";

  return (
    <div className="space-y-6 p-4 bg-slate-800 rounded-b-lg">
      <div>
        <label htmlFor={`${widgetId}-gc-calendarId`} className={commonLabelClass}> Calendar ID </label>
        <input type="text" id={`${widgetId}-gc-calendarId`} value={calendarId} onChange={(e) => setCalendarId(e.target.value)} placeholder="primary (default) or specific ID" className={commonInputClass} />
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Use &apos;primary&apos; for the main calendar, or provide a specific calendar ID (e.g., an email address for a shared calendar).</p>
      </div>

      <div>
        <label htmlFor={`${widgetId}-gc-viewMode`} className={commonLabelClass}> View Mode (Conceptual) </label>
        <select id={`${widgetId}-gc-viewMode`} value={viewMode} onChange={(e) => setViewMode(e.target.value as 'month'|'week'|'day')} className={commonInputClass} >
          <option value="month">Month</option>
          <option value="week" disabled>Week (Future Feature)</option>
          <option value="day" disabled>Day (Future Feature)</option>
        </select>
         <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Currently, only the &apos;Month&apos; view is implemented.</p>
      </div>

      <div className="flex items-center mt-4">
        <input id={`${widgetId}-gc-showWeekends`} type="checkbox" checked={showWeekends} onChange={(e) => setShowWeekends(e.target.checked)} className="h-4 w-4 text-sky-500 focus:ring-sky-500 border-slate-500 rounded mr-2.5 bg-slate-700 dark:bg-slate-600" disabled />
        <label htmlFor={`${widgetId}-gc-showWeekends`} className={`${commonLabelClass} mb-0 ${true ? 'opacity-60' : ''}`}> Show Weekends (Conceptual) </label>
      </div>
      <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 -mt-3">Weekend display is fixed in the current month view implementation.</p>

      <button
        onClick={handleSave}
        className={`${commonButtonClass} mt-8 bg-sky-600 text-white hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-600 focus:ring-sky-500`} >
        Save Calendar Settings
      </button>
    </div>
  );
};

export default GoogleCalendarWidget;
