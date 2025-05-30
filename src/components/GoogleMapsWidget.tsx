/// <reference types="@types/google.maps" />
/// <reference types="@types/google.accounts" />

// src/components/GoogleMapsWidget.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';

import { type GoogleMapsWidgetSettings } from '@/definitions/widgetConfig';
// Types for GAPI and Google Identity Services are now expected to be globally available
// from src/types/gapi.d.ts.
// Note: Specific types like google.accounts.oauth2.TokenResponse will be directly used.

// --- Local Interface Specific to this Widget ---
interface RouteDetails {
  distance: string;
  duration: string;
  summary: string;
  startAddress: string;
  endAddress: string;
  steps?: google.maps.DirectionsStep[];
}

// --- Component Props ---
interface GoogleMapsWidgetProps { settings?: GoogleMapsWidgetSettings; instanceId?: string; }

// --- Environment Variables ---
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";

// --- SVG Icons (Google Material Style) ---
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className, title }) => (
  <span className={`inline-flex items-center justify-center ${className}`} title={title}>{children}</span>
);

const GoogleLogoIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (<IconWrapper className={className}><svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg></IconWrapper>);
const SignOutIcon: React.FC<{className?: string}> = ({className="w-5 h-5"}) => <IconWrapper className={className}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></IconWrapper>;
const MyLocationIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => <IconWrapper className={className}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="2" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="22"></line><line x1="2" y1="12" x2="5" y2="12"></line><line x1="19" y1="12" x2="22" y2="12"></line><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"></line><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"></line><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"></line></svg></IconWrapper>;
const DirectionsIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => <IconWrapper className={className}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg></IconWrapper>;
const EditRouteIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></IconWrapper>;
const ClearRouteIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => <IconWrapper className={className}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></IconWrapper>;
const ErrorStateIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => <IconWrapper className={className}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></IconWrapper>;
const GoogleMapsPinLogo: React.FC<{ className?: string }> = ({ className = "w-16 h-auto" }) => (<IconWrapper className={className}><svg viewBox="0 0 384 512" fill="#4285F4" xmlns="http://www.w3.org/2000/svg"><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 01-35.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/></svg></IconWrapper>);

interface WindowWithCallback extends Window {
  [key: `initMap_${string}`]: (() => void) | undefined;
}

// --- Main Widget Component ---
const GoogleMapsWidget: React.FC<GoogleMapsWidgetProps> = ({ settings, instanceId }) => {
  const [gapiReady, setGapiReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [mapsApiLoaded, setMapsApiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const toAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [fromLocation, setFromLocation] = useState(settings?.defaultLocation === 'current' || !settings?.defaultLocation ? "" : settings.defaultLocation);
  const [toLocation, setToLocation] = useState('');
  const [currentResolvedLocation, setCurrentResolvedLocation] = useState<google.maps.LatLng | string | null>(null);
  const [isFetchingDirections, setIsFetchingDirections] = useState(false);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);

  const [isWidgetHovered, setIsWidgetHovered] = useState(false);
  const [isPanelForceExpanded, setIsPanelForceExpanded] = useState(false);
  const panelCollapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);


  const currentSettings = useMemo(() => ({
    defaultLocation: settings?.defaultLocation || 'current',
    zoomLevel: settings?.zoomLevel || 12,
    mapType: settings?.mapType || 'roadmap',
    showTraffic: settings?.showTraffic || false,
  }), [settings?.defaultLocation, settings?.zoomLevel, settings?.mapType, settings?.showTraffic]);

  useEffect(() => {
    if (currentSettings.defaultLocation === 'current') {
      setFromLocation("My Current Location");
    } else {
      setFromLocation(currentSettings.defaultLocation || "");
    }
  }, [currentSettings.defaultLocation]);

  // --- Script Loading Effects ---
  useEffect(() => {
    const scriptGapi = document.createElement('script');
    scriptGapi.src = 'https://apis.google.com/js/api.js';
    scriptGapi.async = true; scriptGapi.defer = true;
    scriptGapi.onload = () => { if (window.gapi) window.gapi.load('client', () => setGapiReady(true)); };
    scriptGapi.onerror = () => { setError("Failed to load Google API script."); setIsLoading(false); }
    document.body.appendChild(scriptGapi);
    return () => { if (document.body.contains(scriptGapi)) document.body.removeChild(scriptGapi); };
  }, []);

  useEffect(() => {
    const scriptGis = document.createElement('script');
    scriptGis.src = 'https://accounts.google.com/gsi/client';
    scriptGis.async = true; scriptGis.defer = true;
    scriptGis.onload = () => setGisReady(true);
    scriptGis.onerror = () => { setError("Failed to load Google Identity Services."); setIsLoading(false); }
    document.body.appendChild(scriptGis);
    return () => { if (document.body.contains(scriptGis)) document.body.removeChild(scriptGis); };
  }, []);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places && window.google.maps.routes) {
        if (!mapsApiLoaded) setMapsApiLoaded(true);
        return;
    }
    if (!API_KEY) {
        setError("Google Maps API Key is missing.");
        setIsLoading(false);
        return;
    }
    if (mapsApiLoaded) return;

    const SCRIPT_ID = `google-maps-script-${instanceId || 'global'}`;
    if (document.getElementById(SCRIPT_ID)) {
        if (window.google && window.google.maps && !mapsApiLoaded) {
             setMapsApiLoaded(true);
        }
        return;
    }

    const callbackName = `initMap_${(instanceId || 'global').replace(/-/g, '_')}` as `initMap_${string}`;
    const typedWindow = window as WindowWithCallback;

    if (typedWindow[callbackName]) delete typedWindow[callbackName];

    typedWindow[callbackName] = () => {
        setMapsApiLoaded(true);
        delete typedWindow[callbackName];
    };

    const scriptMaps = document.createElement('script');
    scriptMaps.id = SCRIPT_ID;
    scriptMaps.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=${callbackName}&libraries=places,routes&v=weekly`;
    scriptMaps.async = true;
    scriptMaps.defer = true;
    scriptMaps.onerror = () => {
        setError("Failed to load Google Maps script.");
        setIsLoading(false);
        if (typedWindow[callbackName]) delete typedWindow[callbackName];
    };
    document.head.appendChild(scriptMaps);

    return () => {
        const scriptElement = document.getElementById(SCRIPT_ID);
        if (scriptElement && scriptElement.parentNode) {
            scriptElement.parentNode.removeChild(scriptElement);
        }
        if (typedWindow[callbackName]) {
            delete typedWindow[callbackName];
        }
    };
  }, [instanceId, mapsApiLoaded]);


  // --- Authentication Logic ---
  const fetchUserProfile = useCallback(async () => {
    if (!window.gapi?.client?.oauth2?.userinfo) {
        console.warn("GAPI oauth2.userinfo not available for fetching profile.");
        return;
    }
    try {
      const response = await window.gapi.client.oauth2.userinfo.get();
      if (response?.result) {
        setUserName(response.result.name || response.result.email || 'User');
        setUserImage(response.result.picture || null);
      }
    } catch (e) { console.error("Error fetching user profile:", e); }
  }, []);

  const initializeAuthClient = useCallback(async () => {
    if (!CLIENT_ID) { setIsLoading(false); setIsSignedIn(false); setError("Google Client ID is missing."); return; }
    if (!window.gapi?.client || !window.google?.accounts?.oauth2) { setError("Auth libraries not fully loaded."); setIsLoading(false); setIsSignedIn(false); return; }

    setIsLoading(true); setError(null);
    try {
        if (!window.gapi.client.oauth2) { 
            await window.gapi.client.load('oauth2', 'v2');
        }

        const existingToken = window.gapi.client.getToken();
        if (existingToken && existingToken.access_token) {
            setIsSignedIn(true);
            await fetchUserProfile();
            setIsLoading(false);
            return;
        }

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: async (tokenResponse: google.accounts.oauth2.TokenResponse) => { 
                setIsLoading(true);
                if (tokenResponse.access_token) { // Check for access_token directly
                    if(window.gapi?.client?.setToken) window.gapi.client.setToken({ access_token: tokenResponse.access_token });
                    setIsSignedIn(true);
                    setError(null);
                    await fetchUserProfile();
                } else if (tokenResponse.error) { // Check for error property
                    const errorDesc = tokenResponse.error_description;
                    setError(`Sign-In Error: ${errorDesc || tokenResponse.error}`);
                    setIsSignedIn(false);
                } else {
                    setError("Sign-In failed: Unexpected response structure.");
                    setIsSignedIn(false);
                }
                setIsLoading(false);
            },
            error_callback: (errorResponse: google.accounts.oauth2.ClientConfigError) => { 
                setIsLoading(true);
                let msg = 'Sign-in process failed.';
                if (errorResponse?.type === 'popup_closed') {
                     msg = 'Sign-in popup was closed.';
                } else if (errorResponse?.type === 'popup_failed_to_open') {
                     msg = 'Popup blocker may be active.';
                } else if ('message' in errorResponse && typeof (errorResponse as {message: string}).message === 'string') {
                    msg = `${errorResponse.type ? errorResponse.type + ': ' : ''}${(errorResponse as {message: string}).message}`;
                } else if (errorResponse?.type) {
                    msg = errorResponse.type;
                }
                setError(msg);
                setIsSignedIn(false);
                setIsLoading(false);
            }
        });
        setIsSignedIn(false); 
        setIsLoading(false);
    } catch (e: unknown) {
        setError(`Auth Client Init Error: ${(e as Error).message || 'Unknown error'}`);
        setIsSignedIn(false);
        setIsLoading(false);
    }
  }, [fetchUserProfile]); 

  useEffect(() => {
    if (gapiReady && gisReady) {
      initializeAuthClient();
    }
  }, [gapiReady, gisReady, initializeAuthClient]);

  // --- Map Initialization ---
  const initGoogleMap = useCallback(() => {
    if (!mapsApiLoaded || !mapRef.current || mapInstanceRef.current || !window.google?.maps) return;
    const mapOptions: google.maps.MapOptions = {
      center: { lat: 37.7749, lng: -122.4194 }, zoom: currentSettings.zoomLevel,
      mapTypeId: currentSettings.mapType as google.maps.MapTypeId, 
      disableDefaultUI: true, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
      gestureHandling: 'greedy',
      styles: [ { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] }, { elementType: "labels.icon", stylers: [{ visibility: "off" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#5f6368" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] }, { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#dadce0" }] }, { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] }, { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] }, { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#70757a" }] }, { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e6f4ea" }] }, { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#5f6368" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] }, { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#70757a" }] }, { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e8eaed" }] }, { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#5f6368" }] }, { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#70757a" }] }, { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e0e0e0" }] }, { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#a8c7fa" }] }, { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5f6368" }] } ]
    };
    const map = new window.google.maps.Map(mapRef.current, mapOptions);
    mapInstanceRef.current = map;
    try {
      if (window.google.maps.DirectionsService && window.google.maps.DirectionsRenderer) {
        directionsServiceRef.current = new window.google.maps.DirectionsService();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({ suppressMarkers: false, polylineOptions: { strokeColor: '#4285F4', strokeWeight: 5, strokeOpacity: 0.9 } });
        directionsRendererRef.current.setMap(map);
      } else { throw new Error("Directions services not available on window.google.maps."); }
    } catch (e: unknown) { setError(`Directions features unavailable: ${(e as Error).message}.`); }

    if (currentSettings.showTraffic) { const trafficLayer = new window.google.maps.TrafficLayer(); trafficLayer.setMap(map); }

    if (currentSettings.defaultLocation === 'current') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => { const loc = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude); map.setCenter(loc); setCurrentResolvedLocation(loc); setFromLocation("My Current Location"); },
          () => { map.setCenter({ lat: 34.0522, lng: -118.2437 }); setError("Could not get current location. Defaulting to LA."); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else { map.setCenter({ lat: 34.0522, lng: -118.2437 }); setError("Geolocation not supported. Defaulting to LA.");}
    } else if (currentSettings.defaultLocation) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: currentSettings.defaultLocation }, (results, status) => {
            if (status === 'OK' && results && results[0]) { map.setCenter(results[0].geometry.location); setCurrentResolvedLocation(results[0].geometry.location); setFromLocation(currentSettings.defaultLocation); }
            else { map.setCenter({ lat: 34.0522, lng: -118.2437 }); setError(`Could not geocode default location: ${status}. Defaulting to LA.`);}
        });
    } else {
        map.setCenter({ lat: 34.0522, lng: -118.2437 }); 
    }
  }, [mapsApiLoaded, currentSettings]);

  useEffect(() => {
    if (mapsApiLoaded && !isLoading && ((CLIENT_ID && isSignedIn) || !CLIENT_ID)) {
        initGoogleMap();
    }
  }, [mapsApiLoaded, isSignedIn, isLoading, initGoogleMap]);

  // --- Autocomplete Initialization Effect ---
  useEffect(() => {
    if (!mapsApiLoaded || !window.google?.maps?.places || !isPanelForceExpanded) {
        if (fromAutocompleteRef.current && window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(fromAutocompleteRef.current);
        }
        if (toAutocompleteRef.current && window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(toAutocompleteRef.current);
        }
        return;
    }

    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      fields: ["formatted_address", "geometry", "name", "place_id"],
      types: ['geocode', 'establishment'] 
    };

    if (fromInputRef.current && (!fromAutocompleteRef.current || !fromAutocompleteRef.current.getPlace())) { 
        const newFromAC = new window.google.maps.places.Autocomplete(fromInputRef.current, autocompleteOptions);
        newFromAC.addListener('place_changed', () => {
            const place = newFromAC.getPlace();
            const locationValue = place?.formatted_address || place?.name;
            if (locationValue) { setFromLocation(locationValue); setCurrentResolvedLocation(locationValue); }
        });
        fromAutocompleteRef.current = newFromAC;
    }
    if (toInputRef.current && (!toAutocompleteRef.current || !toAutocompleteRef.current.getPlace())) { 
        const newToAC = new window.google.maps.places.Autocomplete(toInputRef.current, autocompleteOptions);
        newToAC.addListener('place_changed', () => {
            const place = newToAC.getPlace();
            if (place?.formatted_address || place?.name) { setToLocation(place.formatted_address || place.name!); }
        });
        toAutocompleteRef.current = newToAC;
    }

  }, [mapsApiLoaded, isPanelForceExpanded]);


  // --- UI Event Handlers ---
  const handleSignIn = () => {
    if (!tokenClientRef.current) { setError("Sign-In service is not ready. Please wait or refresh."); return; }
    setIsLoading(true);
    tokenClientRef.current.requestAccessToken({ prompt: 'consent' }); 
  };

  const handleSignOut = () => {
    setIsLoading(true);
    const token = window.gapi?.client?.getToken ? window.gapi.client.getToken() : null;
    const cb = () => {
      if (window.gapi?.client?.setToken) window.gapi.client.setToken(null);
      setIsSignedIn(false); setUserName(null); setUserImage(null); setRouteDetails(null);
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(null); // Clear directions
      }
      setCurrentResolvedLocation(null); setToLocation('');
      setFromLocation(currentSettings.defaultLocation === 'current' ? "My Current Location" : (currentSettings.defaultLocation || ""));
      if(window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect(); 
      setIsLoading(false);
    };

    if (token?.access_token && window.google?.accounts?.oauth2?.revoke) {
        window.google.accounts.oauth2.revoke(token.access_token, cb);
    } else {
        cb();
    }
  };

  const handleGetDirections = () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current ) { setError("Directions service not ready."); return; }
    if (!toLocation.trim()) { setError("Please enter a destination."); return; }

    let originReq: string | google.maps.LatLng | google.maps.Place;
    if (fromLocation === "My Current Location" && currentResolvedLocation instanceof google.maps.LatLng) {
        originReq = currentResolvedLocation;
    } else if (fromLocation.trim()) {
        originReq = fromLocation;
    } else {
        setError("Please set a starting location or use 'My Current Location'."); return;
    }

    setError(null); setIsFetchingDirections(true); setRouteDetails(null);
    directionsServiceRef.current.route(
      { origin: originReq, destination: toLocation, travelMode: google.maps.TravelMode.DRIVING }, 
      (res, status) => {
        setIsFetchingDirections(false);
        if (status === 'OK' && res && res.routes && res.routes.length > 0) {
          directionsRendererRef.current!.setDirections(res);
          const leg = res.routes[0].legs[0];
          if (leg) {
            setRouteDetails({
                distance: leg.distance?.text || 'N/A',
                duration: leg.duration?.text || 'N/A',
                summary: res.routes[0].summary || 'N/A', 
                startAddress: leg.start_address || 'N/A',
                endAddress: leg.end_address || 'N/A',
                steps: leg.steps 
            });
          }
        } else { setError(`Directions request failed: ${status}. Please check locations or try again.`); }
      }
    );
  };
  const handleClearRoute = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections(null); // Clear directions
    }
    setRouteDetails(null); setToLocation('');
    if (toInputRef.current) toInputRef.current.value = ""; 
    setError(null);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation && window.google?.maps) { setError(null);
        navigator.geolocation.getCurrentPosition(pos => {
            const userLoc = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            mapInstanceRef.current?.setCenter(userLoc);
            mapInstanceRef.current?.setZoom(15); 
            setCurrentResolvedLocation(userLoc);
            setFromLocation("My Current Location");
            if (fromInputRef.current) fromInputRef.current.value = "My Current Location";
            handleClearRoute(); 
        }, () => setError("Could not get current location. Please enable location services."), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else { setError("Geolocation is not supported or Maps API not ready."); }
  };

  const handleMouseEnter = () => { setIsWidgetHovered(true); if (panelCollapseTimeoutRef.current) { clearTimeout(panelCollapseTimeoutRef.current); panelCollapseTimeoutRef.current = null; } setIsPanelForceExpanded(true); };
  const handleMouseLeave = () => { setIsWidgetHovered(false); if (panelCollapseTimeoutRef.current) clearTimeout(panelCollapseTimeoutRef.current); panelCollapseTimeoutRef.current = setTimeout(() => { setIsPanelForceExpanded(false); }, 3000); }; 
  useEffect(() => { return () => { if (panelCollapseTimeoutRef.current) clearTimeout(panelCollapseTimeoutRef.current); }; }, []);

  // --- Styling & Panel Logic ---
  const inputBaseClass = "w-full px-3.5 py-2.5 text-sm text-zinc-800 dark:text-zinc-100 bg-white dark:bg-zinc-700/80 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-sm focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-200 ease-in-out";
  const inputFocusClass = "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400";
  const buttonBaseClass = "px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-all duration-200 ease-in-out flex items-center justify-center group transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed";
  const primaryButtonClass = `${buttonBaseClass} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400`;
  const iconButtonClass = "p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors";

  const panelIsFullyExpanded = isPanelForceExpanded || isWidgetHovered;
  const showCompactRouteWithIcons = !panelIsFullyExpanded && routeDetails;

  let panelWidthClass = 'w-[60px] sm:w-[72px]'; 
  if (panelIsFullyExpanded) {
    panelWidthClass = 'w-full md:w-[360px] lg:w-[340px] xl:w-[380px]'; 
  } else if (routeDetails) {
    panelWidthClass = 'w-full md:w-[280px] lg:w-[260px]'; 
  }

  // --- Render Logic ---
  if (isLoading && !error) { return (<div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 p-6 rounded-xl shadow-lg"><svg className="animate-spin h-10 w-10 text-blue-500 dark:text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="text-sm">{!gisReady ? "Loading Identity..." : !gapiReady ? "Loading API Client..." : !mapsApiLoaded && API_KEY ? "Loading Maps..." : "Finalizing..."}</p></div>); }
  if (error) { return (<div className="flex flex-col items-center justify-center text-center h-full w-full p-6 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600/40 rounded-xl shadow-lg text-red-700 dark:text-red-300"><ErrorStateIcon className="text-red-500 dark:text-red-400 mb-4 w-10 h-10" /><h3 className="text-lg font-semibold mb-1.5">Map Error</h3><p className="text-sm mb-4 max-w-md">{error}</p>{(!CLIENT_ID && error.includes("Client ID")) && <p className="mb-2 text-xs">Google Client ID missing. Please check environment variables.</p>}{(!API_KEY && error.includes("API Key")) && <p className="mb-2 text-xs">Google Maps API Key missing. Please check environment variables.</p>}{(error.includes("Auth") || error.includes("Sign-In")) && CLIENT_ID && (<button onClick={handleSignIn} disabled={!tokenClientRef.current || isLoading} className={`${buttonBaseClass} bg-zinc-100 hover:bg-zinc-200 text-zinc-700 focus:ring-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-200 dark:focus:ring-zinc-500 mt-2 text-xs py-2 px-3.5`}>Retry Sign In</button>)}</div>); }
  if (CLIENT_ID && !isSignedIn) { return (<div className="flex flex-col items-center justify-center h-full w-full text-center p-6 sm:p-10 bg-gradient-to-br from-slate-100 to-blue-100 dark:from-zinc-800 dark:to-blue-900/80 rounded-xl shadow-xl"><GoogleMapsPinLogo className="text-blue-500 dark:text-blue-400 mb-6 w-20 h-auto" /><h1 className="text-2xl font-bold mb-3 text-zinc-800 dark:text-zinc-100">Explore with Google Maps</h1><p className="text-sm text-zinc-600 dark:text-zinc-300 mb-8 max-w-sm">Sign in to search, get directions, and see real-time traffic.</p><button onClick={handleSignIn} disabled={!tokenClientRef.current || isLoading} className={`${primaryButtonClass} text-base py-3 px-6 shadow-lg hover:shadow-xl`}>{isLoading ? <svg className="animate-spin -ml-1 mr-2.5 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <GoogleLogoIcon className="mr-2.5 -ml-0.5 w-5 h-5"/>}Sign In with Google</button></div>); }

  return (
    <div
      className={`flex flex-col h-full w-full bg-slate-100 dark:bg-zinc-900 rounded-xl overflow-hidden group transition-shadow duration-300 ease-in-out border border-slate-200 dark:border-zinc-700 ${isWidgetHovered ? 'shadow-2xl' : 'shadow-xl'}`}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
    >
      {CLIENT_ID && isSignedIn && ( <header className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex-shrink-0 shadow-sm"><div className="flex items-center min-w-0">{userImage ? (<Image src={userImage} alt={userName || 'User'} width={30} height={30} className="w-[30px] h-[30px] rounded-full mr-2.5 shadow border border-slate-200 dark:border-zinc-600"/>) : userName ? (<div className="w-[30px] h-[30px] rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold mr-2.5 shadow border border-blue-600">{userName.charAt(0).toUpperCase()}</div>): null}<span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{userName || 'Google Maps'}</span></div><button onClick={handleSignOut} title="Sign Out" className={`${iconButtonClass} p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700`}><SignOutIcon className="w-4 h-4"/></button></header> )}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        {/* Control Panel */}
        <div className={`${panelWidthClass} flex-shrink-0 bg-white dark:bg-zinc-800 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-700 flex flex-col overflow-hidden transition-all duration-300 ease-in-out max-h-full`}>

          {/* Expanded Panel Content */}
          {panelIsFullyExpanded && (
            <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar-maps flex-grow flex flex-col">
              {/* Input Fields */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <label htmlFor={`${instanceId}-from`} className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">From</label>
                  <div className="flex items-center space-x-1.5">
                    <input ref={fromInputRef} type="text" id={`${instanceId}-from`} defaultValue={fromLocation} onChange={(e) => { setFromLocation(e.target.value); if(!e.target.value.trim()) {setCurrentResolvedLocation(null); handleClearRoute();} }} placeholder="Start point or My Location" className={`${inputBaseClass} ${inputFocusClass} flex-grow pr-9`} disabled={isFetchingDirections}/>
                    <button onClick={handleUseMyLocation} title="Use My Current Location" className={`${iconButtonClass} absolute right-1 top-1/2 transform -translate-y-1/2 mt-3 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-700/30`} disabled={isFetchingDirections || isLoading}><MyLocationIcon className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-3">
                  <label htmlFor={`${instanceId}-to`} className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">To</label>
                  <input ref={toInputRef} type="text" id={`${instanceId}-to`} defaultValue={toLocation} onChange={(e) => { setToLocation(e.target.value); if(!e.target.value.trim()) handleClearRoute();}} placeholder="Enter destination" className={`${inputBaseClass} ${inputFocusClass}`} disabled={isFetchingDirections}/>
                </div>
                <div className="flex items-center space-x-2 pt-3">
                  <button onClick={handleGetDirections} className={`${primaryButtonClass} flex-grow text-sm py-2.5`} disabled={!mapsApiLoaded || isFetchingDirections || !toLocation.trim() || (!fromLocation.trim() && !currentResolvedLocation) || !directionsServiceRef.current}>{isFetchingDirections ? <svg className="animate-spin -ml-1 mr-2 h-4.5 w-4.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <DirectionsIcon className="w-5 h-5 mr-1.5 -ml-0.5" />}{isFetchingDirections ? "Searching..." : "Directions"}</button>
                </div>
              </div>
              {/* Route Details */}
              {routeDetails && (
                <div className="relative p-3 mt-3 bg-slate-50 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-200 border-t border-slate-200 dark:border-zinc-700 overflow-y-auto custom-scrollbar-maps flex-grow min-h-[100px]">
                  <button onClick={handleClearRoute} title="Clear Route" className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors z-10 text-zinc-500 hover:bg-slate-200 dark:text-zinc-400 dark:hover:bg-zinc-700`}><ClearRouteIcon className="w-3.5 h-3.5" /></button>
                  <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Route Overview</h4>
                  <div className="space-y-1.5 text-xs">
                    <p><strong className="font-medium text-zinc-500 dark:text-zinc-400">From:</strong> {routeDetails.startAddress}</p>
                    <p><strong className="font-medium text-zinc-500 dark:text-zinc-400">To:</strong> {routeDetails.endAddress}</p>
                    <p><strong className="font-medium text-zinc-500 dark:text-zinc-400">Distance:</strong> {routeDetails.distance}</p>
                    <p><strong className="font-medium text-zinc-500 dark:text-zinc-400">Duration:</strong> {routeDetails.duration}</p>
                    {routeDetails.summary && <p><strong className="font-medium text-zinc-500 dark:text-zinc-400">Via:</strong> {routeDetails.summary}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compact Panel Content (Icons or Route Summary) */}
          {!panelIsFullyExpanded && (
            <div className="flex flex-col h-full">
              {/* Icon Buttons for compact view */}
              <div className={`p-2 flex items-center transition-all duration-200 ease-in-out flex-shrink-0
                              ${(!panelIsFullyExpanded && !routeDetails) ? 'justify-center space-x-2 flex-grow items-center' : 'justify-start space-x-1'}
                              ${showCompactRouteWithIcons ? 'bg-blue-700 dark:bg-blue-800 border-b border-blue-600 dark:border-blue-700' : ''}
                            `}>
                <button onClick={handleUseMyLocation} title="My Current Location"
                        className={`${iconButtonClass} p-2
                                    ${showCompactRouteWithIcons ? 'text-blue-200 hover:bg-blue-600 dark:text-blue-300 dark:hover:bg-blue-700' : 'text-blue-600 dark:text-blue-400'}`}
                        disabled={isFetchingDirections || isLoading}>
                  <MyLocationIcon className="w-5 h-5" />
                </button>
                <button onClick={() => { setIsPanelForceExpanded(true); setIsWidgetHovered(true); }}
                        title={routeDetails ? "Edit Route" : "Get Directions"}
                        className={`${iconButtonClass} p-2
                                    ${showCompactRouteWithIcons ? 'text-blue-200 hover:bg-blue-600 dark:text-blue-300 dark:hover:bg-blue-700' : 'text-blue-600 dark:text-blue-400'}`}
                        disabled={isFetchingDirections || isLoading}>
                  {routeDetails ? <EditRouteIcon className="w-5 h-5" /> : <DirectionsIcon className="w-5 h-5" />}
                </button>
              </div>

              {/* Compact Route Summary */}
              {showCompactRouteWithIcons && routeDetails && (
                <div className="relative p-3 overflow-y-auto custom-scrollbar-maps flex-grow bg-blue-700 dark:bg-blue-800 text-blue-50 dark:text-blue-100">
                  <button onClick={handleClearRoute} title="Clear Route" className="absolute top-2 right-2 p-1.5 rounded-full transition-colors z-10 text-blue-200 hover:bg-blue-600 dark:text-blue-300 dark:hover:bg-blue-700"><ClearRouteIcon className="w-3.5 h-3.5" /></button>
                  <div className="space-y-1 text-xs mt-1">
                    <p className="truncate" title={routeDetails.startAddress}><strong className="font-medium text-blue-200 dark:text-blue-300">From:</strong> {routeDetails.startAddress}</p>
                    <p className="truncate" title={routeDetails.endAddress}><strong className="font-medium text-blue-200 dark:text-blue-300">To:</strong> {routeDetails.endAddress}</p>
                    <p><strong className="font-medium text-blue-200 dark:text-blue-300">Dist:</strong> {routeDetails.distance}</p>
                    <p><strong className="font-medium text-blue-200 dark:text-blue-300">Time:</strong> {routeDetails.duration}</p>
                    {routeDetails.summary && <p className="truncate" title={routeDetails.summary}><strong className="font-medium text-blue-200 dark:text-blue-300">Via:</strong> {routeDetails.summary}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Map Area */}
        <div ref={mapRef} className="flex-grow w-full h-full bg-slate-200 dark:bg-zinc-700 relative">
          {(!mapsApiLoaded && !error && API_KEY && isLoading) && ( <div className="absolute inset-0 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm bg-slate-200/80 dark:bg-zinc-700/80 backdrop-blur-sm z-10"><svg className="animate-spin h-6 w-6 text-blue-500 mr-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading map...</div> )}
        </div>
      </div>
       <style jsx global>{`
        .custom-scrollbar-maps::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar-maps::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-maps::-webkit-scrollbar-thumb { background: #cbd5e1; /* zinc-300 */ border-radius: 10px; }
        .dark .custom-scrollbar-maps::-webkit-scrollbar-thumb { background: #52525b; /* zinc-600 */ }
        .custom-scrollbar-maps::-webkit-scrollbar-thumb:hover { background: #94a3b8; /* zinc-400 */ }
        .dark .custom-scrollbar-maps::-webkit-scrollbar-thumb:hover { background: #71717a; /* zinc-500 */ }

        /* Google Places Autocomplete dropdown styling */
        .pac-container {
          background-color: #ffffff !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06) !important;
          z-index: 1055 !important; /* Ensure it's above other elements */
          border: 1px solid #e0e0e0 !important;
          margin-top: 4px !important;
        }
        .pac-item {
          padding: 10px 14px !important;
          font-size: 14px !important;
          color: #3c4043 !important;
          border-top: 1px solid #f1f3f4 !important;
          cursor: pointer;
          transition: background-color 0.15s ease-in-out;
        }
        .pac-item:first-child {
          border-top: none !important;
        }
        .pac-item:hover {
          background-color: #f8f9fa !important;
        }
        .pac-item-query {
          font-weight: 500 !important;
          color: #202124 !important;
        }
        .pac-matched {
          font-weight: 600 !important;
          color: #1a73e8 !important; /* Google Blue */
        }

        /* Dark theme for Autocomplete */
        .dark .pac-container {
          background-color: #2d2e31 !important; /* Darker background */
          border: 1px solid #3c4043 !important;
        }
        .dark .pac-item {
          color: #e8eaed !important; /* Light text */
          border-top: 1px solid #3c4043 !important;
        }
        .dark .pac-item:hover {
          background-color: #3c4043 !important;
        }
        .dark .pac-item-query {
          color: #f8f9fa !important;
        }
        .dark .pac-matched {
          color: #8ab4f8 !important; /* Lighter Google Blue */
        }
       `}</style>
    </div>
  );
};

// Explicitly type the mapType state for clarity and to match setter expectations
type MapTypeOption = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

// Settings Panel
export const GoogleMapsSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: GoogleMapsWidgetSettings | undefined;
  onSave: (newSettings: GoogleMapsWidgetSettings) => void;
}> = ({ currentSettings: initialSettings, onSave, widgetId }) => {
  const [defaultLocation, setDefaultLocation] = useState(initialSettings?.defaultLocation || 'current');
  const [zoomLevel, setZoomLevel] = useState(initialSettings?.zoomLevel || 12);
  // Use the explicit MapTypeOption for state and ensure it's never undefined
  const [mapType, setMapType] = useState<MapTypeOption>(initialSettings?.mapType || 'roadmap');
  const [showTraffic, setShowTraffic] = useState(initialSettings?.showTraffic || false);

  const handleSave = () => {
    onSave({
        defaultLocation: defaultLocation.trim() === '' ? 'current' : defaultLocation.trim(),
        zoomLevel: Number(zoomLevel),
        mapType: mapType, // mapType state is already of type MapTypeOption
        showTraffic
    });
  };

  const inputBaseClass = "w-full px-3.5 py-2 text-sm text-zinc-800 dark:text-zinc-100 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-500 rounded-lg shadow-sm focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors";
  const inputFocusClass = "focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400";
  const labelClass = "block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5";
  const buttonClass = "w-full px-4 py-2.5 text-sm font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900";

  return (
    <div className="space-y-5 p-5 bg-slate-100 dark:bg-zinc-800/70 rounded-b-xl border-t border-slate-200 dark:border-zinc-700">
      <div>
        <label htmlFor={`${widgetId}-gm-defaultLocation`} className={labelClass}>
          Default &quot;From&quot; Location
        </label>
        <input
          type="text"
          id={`${widgetId}-gm-defaultLocation`}
          value={defaultLocation}
          onChange={(e) => setDefaultLocation(e.target.value)}
          placeholder="'current' or an address"
          className={`${inputBaseClass} ${inputFocusClass}`}
        />
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">Use &apos;current&apos; for device location, or a specific address/place.</p>
      </div>
      <div>
        <label htmlFor={`${widgetId}-gm-zoomLevel`} className={labelClass}>
          Default Zoom Level ({zoomLevel})
        </label>
        <input
          type="range"
          id={`${widgetId}-gm-zoomLevel`}
          min="1" max="20"
          value={zoomLevel}
          onChange={(e) => setZoomLevel(Number(e.target.value))}
          className={`w-full h-2 bg-zinc-200 dark:bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-blue-500 dark:accent-blue-400`}
        />
      </div>
      <div>
        <label htmlFor={`${widgetId}-gm-mapType`} className={labelClass}>
          Map Type
        </label>
        <select
          id={`${widgetId}-gm-mapType`}
          value={mapType}
          // Ensure the value passed to setMapType is one of the valid MapTypeOption values
          onChange={(e) => setMapType(e.target.value as MapTypeOption)}
          className={`${inputBaseClass} ${inputFocusClass}`}
        >
          <option value="roadmap">Roadmap</option>
          <option value="satellite">Satellite</option>
          <option value="hybrid">Hybrid</option>
          <option value="terrain">Terrain</option>
        </select>
      </div>
      <div className="flex items-center pt-1.5">
        <input
          id={`${widgetId}-gm-showTraffic`}
          type="checkbox"
          checked={showTraffic}
          onChange={(e) => setShowTraffic(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-500 rounded mr-2.5 bg-white dark:bg-zinc-700 shadow-sm"
        />
        <label htmlFor={`${widgetId}-gm-showTraffic`} className={`${labelClass} mb-0 cursor-pointer select-none`}>
          Show Real-time Traffic Layer
        </label>
      </div>
      <button
        onClick={handleSave}
        className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:ring-blue-500 mt-3`}
      >
        Save Map Settings
      </button>
    </div>
  );
};

export default GoogleMapsWidget;
