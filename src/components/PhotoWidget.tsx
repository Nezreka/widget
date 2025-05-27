// src/components/PhotoWidget.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

// --- API Response Type Definitions ---
interface UnsplashUser {
  name: string;
  links: { html: string; };
  location?: string | null;
}
interface UnsplashUrls { regular: string; }
interface UnsplashLinks { html: string; }
interface UnsplashImageResponse {
  id: string;
  alt_description?: string | null;
  description?: string | null;
  urls: UnsplashUrls;
  user: UnsplashUser;
  links: UnsplashLinks;
  color?: string | null;
  width: number;
  height: number;
}
interface UnsplashSearchResponse { results: UnsplashImageResponse[]; }

interface PexelsPhotoSource { large2x: string; large: string; }
interface PexelsPhotoResponse {
  id: number;
  alt?: string | null;
  src: PexelsPhotoSource;
  photographer: string;
  photographer_url: string;
  url: string;
  avg_color?: string | null;
  width: number;
  height: number;
}
interface PexelsSearchResponse { photos: PexelsPhotoResponse[]; }

interface PixabayHitResponse {
  id: number;
  largeImageURL: string;
  tags?: string;
  user: string;
  user_id: number;
  pageURL: string;
  imageWidth: number;
  imageHeight: number;
}
interface PixabaySearchResponse { hits: PixabayHitResponse[]; }

// --- Widget Specific Interfaces & Types ---
export interface HistoricImage {
  id: string;
  url: string;
  name?: string;
  timestamp: number;
}

export type PhotoProvider = 'unsplash' | 'pexels' | 'pixabay' | 'random';
export type SlideshowMode = 'history' | 'api';

// Specific type for object-fit values to be used in the type guard
export type ObjectFitValue = 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';
const VALID_OBJECT_FIT_VALUES: ObjectFitValue[] = ['contain', 'cover', 'fill', 'scale-down', 'none'];

function isObjectFitValue(value: string): value is ObjectFitValue {
  return (VALID_OBJECT_FIT_VALUES as string[]).includes(value);
}


export interface ApiImage {
  id: string;
  url: string;
  description?: string;
  artistName?: string;
  artistUrl?: string;
  sourceName: PhotoProvider | 'history';
  sourceUrl?: string;
  location?: string;
  color?: string;
  width?: number;
  height?: number;
}
export type SlideshowImage = HistoricImage | ApiImage;

export interface PhotoWidgetSettings {
  imageUrl?: string | null;
  imageName?: string | null;
  objectFit?: ObjectFitValue; // Use the defined type
  isSidebarOpen?: boolean;
  isSlideshowActive?: boolean;
  slideshowMode?: SlideshowMode;
  slideshowInterval?: number;
  slideshowKeyword?: string;
  slideshowProvider?: PhotoProvider;
  slideshowTransitionEffect?: 'fade' | 'kenBurns';
}

interface PhotoWidgetProps {
  id: string;
  settings?: PhotoWidgetSettings;
  onSettingsChange?: (widgetId: string, newSettings: PhotoWidgetSettings) => void;
  sharedHistory: HistoricImage[];
  onSharedHistoryChange: (newHistory: HistoricImage[]) => void;
}

// --- Icons ---
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 group-hover:text-accent-primary transition-colors"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 group-hover:text-accent-primary transition-colors"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const BaseImageIcon = ({ className = "" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-12 h-12 text-slate-500 dark:text-slate-600 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.158 0a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const HistoryIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0zM12 9H9" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const RemoveImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const PlayIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" /></svg>;
const PauseIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" /></svg>;
const StopIcon = ({ className = "w-6 h-6" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" /></svg>;
const NextIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>;
const PrevIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>;
const SlideshowIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3.75v3.75m4.5-3.75v3.75m-7.5-3.75V17.25m6-14.25V6m6 1.25v3.75m-16.5-3.75h16.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V4.5a1.5 1.5 0 0 1 1.5-1.5Zm0 0h16.5" /></svg>;
const KeywordIcon = ({ className = "w-5 h-5 mr-2" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>;
const TimerIcon = ({ className = "w-5 h-5 mr-2" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const OnlinePhotosIcon = ({ className = "w-5 h-5 mr-1.5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5ZM12 12.75a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h.008v.008H8.25V8.25Zm0 0H8.25m7.5 4.5h.008v.008h-.008v-.008Zm0 0h.008m-4.5-.008h.008v.008H11.25v-.008Zm0 0h.008" /></svg>;
const ProviderIcon = ({ className = "w-5 h-5 mr-2" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
const EffectsIcon = ({ className = "w-5 h-5 mr-2" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>;

// --- Constants ---
const MAX_HISTORY_ITEMS = 20;
const DEFAULT_OBJECT_FIT: ObjectFitValue = 'cover'; // Use defined type
const DEFAULT_SLIDESHOW_INTERVAL = 10;
const MIN_HISTORY_FOR_SLIDESHOW = 5;
const API_IMAGE_COUNT = 20;
const DEFAULT_SLIDESHOW_TRANSITION_EFFECT = 'kenBurns';

// Helper function for managing image history
const addImageToHistoryHelper = (
    currentGlobalHistory: HistoricImage[],
    url: string,
    name?: string
): HistoricImage[] => {
    const newHistoryEntry: HistoricImage = {
        id: `${Date.now()}-${url.substring(0, 50)}`,
        url,
        name: name || url.substring(url.lastIndexOf('/') + 1).split('?')[0].replace(/[^\w\s.-]/gi, '') || "Image",
        timestamp: Date.now(),
    };
    const existingEntryIndex = currentGlobalHistory.findIndex(entry => entry.url === url);
    let updatedHistory;
    if (existingEntryIndex !== -1) {
        const existingEntry = { ...currentGlobalHistory[existingEntryIndex], timestamp: Date.now() };
        updatedHistory = [
            existingEntry,
            ...currentGlobalHistory.slice(0, existingEntryIndex),
            ...currentGlobalHistory.slice(existingEntryIndex + 1)
        ];
    } else {
        updatedHistory = [newHistoryEntry, ...currentGlobalHistory];
    }
    return updatedHistory.slice(0, MAX_HISTORY_ITEMS);
};

// --- Settings Panel ---
export const PhotoSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: PhotoWidgetSettings | undefined;
  onSaveInstanceSettings: (newSettings: PhotoWidgetSettings) => void;
  onClearGlobalHistory: () => void;
  globalHistoryLength: number;
}> = ({ widgetId, currentSettings, onSaveInstanceSettings, onClearGlobalHistory, globalHistoryLength }) => {

  const [objectFit, setObjectFit] = useState<ObjectFitValue>(currentSettings?.objectFit || DEFAULT_OBJECT_FIT);
  const [isSlideshowActive, setIsSlideshowActive] = useState(currentSettings?.isSlideshowActive || false);
  const [slideshowMode, setSlideshowMode] = useState<SlideshowMode>(
    currentSettings?.slideshowMode || (globalHistoryLength >= MIN_HISTORY_FOR_SLIDESHOW ? 'history' : 'api')
  );
  const [slideshowInterval, setSlideshowInterval] = useState(currentSettings?.slideshowInterval || DEFAULT_SLIDESHOW_INTERVAL);
  const [slideshowKeyword, setSlideshowKeyword] = useState(currentSettings?.slideshowKeyword || 'epic landscapes');
  const [slideshowProvider, setSlideshowProvider] = useState<PhotoProvider>(currentSettings?.slideshowProvider || 'random');
  const [slideshowTransitionEffect, setSlideshowTransitionEffect] = useState<'fade' | 'kenBurns'>(currentSettings?.slideshowTransitionEffect || DEFAULT_SLIDESHOW_TRANSITION_EFFECT);

  useEffect(() => {
    setObjectFit(currentSettings?.objectFit || DEFAULT_OBJECT_FIT);
    setIsSlideshowActive(currentSettings?.isSlideshowActive || false);
    setSlideshowMode(currentSettings?.slideshowMode || (globalHistoryLength >= MIN_HISTORY_FOR_SLIDESHOW ? 'history' : 'api'));
    setSlideshowInterval(currentSettings?.slideshowInterval || DEFAULT_SLIDESHOW_INTERVAL);
    setSlideshowKeyword(currentSettings?.slideshowKeyword || 'epic landscapes');
    setSlideshowProvider(currentSettings?.slideshowProvider || 'random');
    setSlideshowTransitionEffect(currentSettings?.slideshowTransitionEffect || DEFAULT_SLIDESHOW_TRANSITION_EFFECT);
  }, [currentSettings, globalHistoryLength]);

  const handleSaveSettings = () => {
    onSaveInstanceSettings({
        imageUrl: currentSettings?.imageUrl,
        imageName: currentSettings?.imageName,
        isSidebarOpen: currentSettings?.isSidebarOpen,
        objectFit,
        isSlideshowActive,
        slideshowMode,
        slideshowInterval: Number(slideshowInterval),
        slideshowKeyword,
        slideshowProvider,
        slideshowTransitionEffect,
    });
  };

  const handleClearCurrentImage = () => {
     onSaveInstanceSettings({
        ...currentSettings,
        imageUrl: null,
        imageName: null,
     });
  };

  const inputClass = "mt-1 block w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent sm:text-sm text-primary dark:text-slate-100 transition-all duration-150 ease-in-out hover:shadow-md";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  const buttonClass = "w-full inline-flex items-center justify-center px-4 py-2.5 border text-sm font-medium rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-all duration-150 ease-in-out";
  const toggleButtonClass = `relative inline-flex items-center h-7 rounded-full w-12 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 shadow-inner`;
  const toggleSwitchClass = `inline-block w-5 h-5 transform bg-white rounded-full transition-all duration-300 ease-in-out shadow-md`;

  // Determine if API keys are available for disabling options
  const isUnsplashKeyAvailable = !!process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  const isPexelsKeyAvailable = !!process.env.NEXT_PUBLIC_PEXELS_API_KEY;
  const isPixabayKeyAvailable = !!process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

  return (
    <div className="space-y-6 text-primary dark:text-slate-200 p-1">
      <div>
        <label htmlFor={`photo-objectfit-${widgetId}`} className={labelClass}>
          Image Display Style (Single):
        </label>
        <select
          id={`photo-objectfit-${widgetId}`}
          value={objectFit}
          onChange={(e) => {
            const value = e.target.value;
            if (isObjectFitValue(value)) {
              setObjectFit(value);
            }
          }}
          className={inputClass}
          disabled={isSlideshowActive}
          aria-describedby={isSlideshowActive ? `objectfit-disabled-note-${widgetId}` : undefined}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
          <option value="scale-down">Scale Down</option>
          <option value="none">None (Original Size)</option>
        </select>
        {isSlideshowActive && <p id={`objectfit-disabled-note-${widgetId}`} className="text-xs text-slate-500 dark:text-slate-400 mt-1">Display style is fixed during slideshow.</p>}
      </div>

      <hr className="border-slate-300 dark:border-slate-700/80 my-5" />

      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-primary dark:text-slate-100 flex items-center mb-3">
            <SlideshowIcon className="mr-2.5 w-6 h-6 text-accent-primary" /> Slideshow Settings
        </h3>

        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/30">
            <label htmlFor={`slideshow-active-toggle-${widgetId}`} className={`${labelClass} mb-0 cursor-pointer font-semibold`}>
            Activate Slideshow:
            </label>
            <button id={`slideshow-active-toggle-${widgetId}`} role="switch" aria-checked={isSlideshowActive} onClick={() => setIsSlideshowActive(!isSlideshowActive)} className={`${toggleButtonClass} ${isSlideshowActive ? 'bg-accent-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className="sr-only">Activate Slideshow</span>
                <span className={`${toggleSwitchClass} ${isSlideshowActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>

        {isSlideshowActive && (
          <div className="space-y-5 pl-3 border-l-2 border-accent-primary/30 ml-2 pt-3 pb-2 animate-fadeIn">
            <div>
              <label className={labelClass}>Image Source:</label>
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mt-2">
                <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                  <input type="radio" name={`slideshowMode-${widgetId}`} value="history" checked={slideshowMode === 'history'} onChange={() => setSlideshowMode('history')} disabled={globalHistoryLength < MIN_HISTORY_FOR_SLIDESHOW} className="form-radio h-4 w-4 text-accent-primary bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-600 focus:ring-accent-primary mr-2.5" aria-label={`Use my image history. Current: ${globalHistoryLength}.`} />
                  <HistoryIcon className="w-4 h-4 mr-1.5 text-slate-600 dark:text-slate-400"/> My History ({globalHistoryLength})
                </label>
                <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                  <input type="radio" name={`slideshowMode-${widgetId}`} value="api" checked={slideshowMode === 'api'} onChange={() => setSlideshowMode('api')} className="form-radio h-4 w-4 text-accent-primary bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-600 focus:ring-accent-primary mr-2.5" aria-label="Use online photos." />
                  <OnlinePhotosIcon className="w-4 h-4 mr-1.5 text-slate-600 dark:text-slate-400"/> Online Photos
                </label>
              </div>
              {slideshowMode === 'history' && globalHistoryLength < MIN_HISTORY_FOR_SLIDESHOW && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 px-2">Requires {MIN_HISTORY_FOR_SLIDESHOW}+ images in history.</p>
              )}
            </div>

            {slideshowMode === 'api' && (
              <>
                <div>
                  <label htmlFor={`slideshow-keyword-${widgetId}`} className={`${labelClass} flex items-center`}><KeywordIcon /> Search Keyword:</label>
                  <input type="text" id={`slideshow-keyword-${widgetId}`} value={slideshowKeyword} onChange={(e) => setSlideshowKeyword(e.target.value)} className={inputClass} placeholder="e.g., majestic mountains, neon city" />
                </div>
                <div>
                  <label htmlFor={`slideshow-provider-${widgetId}`} className={`${labelClass} flex items-center`}><ProviderIcon /> Photo Provider:</label>
                  <select id={`slideshow-provider-${widgetId}`} value={slideshowProvider} onChange={(e) => setSlideshowProvider(e.target.value as PhotoProvider)} className={inputClass}>
                    <option value="random">Random Provider</option>
                    <option value="unsplash" disabled={!isUnsplashKeyAvailable}>Unsplash {!isUnsplashKeyAvailable && "(Key Missing)"}</option>
                    <option value="pexels" disabled={!isPexelsKeyAvailable}>Pexels {!isPexelsKeyAvailable && "(Key Missing)"}</option>
                    <option value="pixabay" disabled={!isPixabayKeyAvailable}>Pixabay {!isPixabayKeyAvailable && "(Key Missing)"}</option>
                  </select>
                </div>
              </>
            )}
             <div>
                <label htmlFor={`slideshow-transition-${widgetId}`} className={`${labelClass} flex items-center`}><EffectsIcon /> Transition Effect:</label>
                <select id={`slideshow-transition-${widgetId}`} value={slideshowTransitionEffect} onChange={(e) => setSlideshowTransitionEffect(e.target.value as 'fade' | 'kenBurns')} className={inputClass}>
                    <option value="kenBurns">Ken Burns (Zoom/Pan)</option>
                    <option value="fade">Simple Fade</option>
                </select>
            </div>
            <div>
              <label htmlFor={`slideshow-interval-${widgetId}`} className={`${labelClass} flex items-center`}><TimerIcon /> Change Image Every (seconds):</label>
              <input type="number" id={`slideshow-interval-${widgetId}`} value={slideshowInterval} onChange={(e) => setSlideshowInterval(Math.max(3, Number(e.target.value)))} min="3" className={inputClass} />
            </div>
          </div>
        )}
      </div>

      <hr className="border-slate-300 dark:border-slate-700/80 my-5" />

      <div className="flex flex-col gap-3.5 pt-2">
        <button onClick={handleSaveSettings} type="button" className={`${buttonClass} border-transparent text-white bg-accent-primary hover:bg-opacity-80 focus:ring-accent-primary active:scale-[0.98]`} aria-label="Save all photo widget settings">
            Save Settings
        </button>
        <button onClick={handleClearCurrentImage} type="button" disabled={isSlideshowActive} className={`${buttonClass} border-amber-500/60 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 focus:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]`} aria-label="Clear current single image">
            <TrashIcon /> Clear Single Image
        </button>
        <button onClick={() => { if (window.confirm("Clear GLOBAL image history for ALL photo widgets? This cannot be undone.")) { onClearGlobalHistory(); }}} type="button" disabled={globalHistoryLength === 0} className={`${buttonClass} border-red-500/60 text-red-700 dark:text-red-400 hover:bg-red-500/10 focus:ring-red-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]`} aria-label="Clear global image history">
            <TrashIcon /> Clear Global History
        </button>
      </div>
    </div>
  );
};

// --- Main PhotoWidget Component ---
const PhotoWidget: React.FC<PhotoWidgetProps> = ({
  id,
  settings,
  onSettingsChange,
  sharedHistory,
  onSharedHistoryChange
}) => {
  const currentImageUrl = settings?.imageUrl || null;
  const currentImageName = settings?.imageName || null;
  const objectFit = settings?.objectFit || DEFAULT_OBJECT_FIT;
  const isSidebarOpen = settings?.isSidebarOpen || false;

  const isSlideshowActive = settings?.isSlideshowActive || false;
  const slideshowModeSetting = settings?.slideshowMode;
  const slideshowInterval = (settings?.slideshowInterval || DEFAULT_SLIDESHOW_INTERVAL) * 1000;
  const slideshowKeyword = settings?.slideshowKeyword || 'epic landscapes';
  const slideshowProvider = settings?.slideshowProvider || 'random';
  const slideshowTransitionEffect = settings?.slideshowTransitionEffect || DEFAULT_SLIDESHOW_TRANSITION_EFFECT;

  const [internalImageUrlInput, setInternalImageUrlInput] = useState('');
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [slideshowImages, setSlideshowImages] = useState<ApiImage[]>([]);
  const [currentSlideshowIndex, setCurrentSlideshowIndex] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const [slideshowApiError, setSlideshowApiError] = useState<string | null>(null);
  const [isLoadingApiImages, setIsLoadingApiImages] = useState(false);
  const [imageAnimationKey, setImageAnimationKey] = useState(Date.now());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAddedToHistoryUrlRef = useRef<string | null>(null); // Ref to track last added URL

  const updateInstanceSettings = useCallback((newPartialInstanceSettings: Partial<PhotoWidgetSettings>) => {
    if (onSettingsChange) {
      const currentFullSettings: PhotoWidgetSettings = {
          imageUrl: currentImageUrl,
          imageName: currentImageName,
          objectFit: objectFit,
          isSidebarOpen: isSidebarOpen,
          isSlideshowActive: isSlideshowActive,
          slideshowMode: slideshowModeSetting,
          slideshowInterval: settings?.slideshowInterval || DEFAULT_SLIDESHOW_INTERVAL,
          slideshowKeyword: slideshowKeyword,
          slideshowProvider: slideshowProvider,
          slideshowTransitionEffect: slideshowTransitionEffect,
      };
      onSettingsChange(id, { ...currentFullSettings, ...newPartialInstanceSettings });
    }
  }, [onSettingsChange, id, currentImageUrl, currentImageName, objectFit, isSidebarOpen,
      isSlideshowActive, slideshowModeSetting, settings?.slideshowInterval, slideshowKeyword, slideshowProvider, slideshowTransitionEffect]);

  useEffect(() => { setImageError(false); }, [currentImageUrl]);

  const handleSetImage = useCallback((url: string, name?: string) => {
    updateInstanceSettings({
        isSlideshowActive: false,
        imageUrl: url,
        imageName: name || "Selected Image"
    });
    setImageError(false);
    const newGlobalHistory = addImageToHistoryHelper(sharedHistory, url, name);
    onSharedHistoryChange(newGlobalHistory);
    setInternalImageUrlInput('');
  }, [updateInstanceSettings, sharedHistory, onSharedHistoryChange]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { handleSetImage(reader.result as string, file.name); };
      reader.onerror = () => { setImageError(true); console.error("Error reading file."); };
      reader.readAsDataURL(file);
      if (event.target) event.target.value = ""; // Reset file input
    }
  };

  const handleUrlInputChange = (event: React.ChangeEvent<HTMLInputElement>) => setInternalImageUrlInput(event.target.value);
  const handleUrlInputSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (internalImageUrlInput.trim()) handleSetImage(internalImageUrlInput.trim());
  };
  const handleImageError = () => { setImageError(true); console.warn("Error loading image via URL:", currentImageUrl);};
  const toggleSidebar = () => updateInstanceSettings({ isSidebarOpen: !isSidebarOpen });
  const handleRemoveCurrentImage = () => updateInstanceSettings({ imageUrl: null, imageName: null });

  const fetchApiImages = useCallback(async (): Promise<ApiImage[]> => {
    if (!slideshowKeyword?.trim()) {
      setSlideshowApiError("Please enter a keyword for API search.");
      return [];
    }
    setIsLoadingApiImages(true);
    setSlideshowApiError(null);
    let providerToUse = slideshowProvider;

    const unsplashKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    const pexelsKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
    const pixabayKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

    if (providerToUse === 'random') {
        const providers: PhotoProvider[] = ['unsplash', 'pexels', 'pixabay'];
        const availableProviders = providers.filter(p =>
            (p === 'unsplash' && unsplashKey) ||
            (p === 'pexels' && pexelsKey) ||
            (p === 'pixabay' && pixabayKey)
        );
        if (availableProviders.length === 0) {
            setSlideshowApiError("No API keys configured. Cannot fetch random images.");
            setIsLoadingApiImages(false);
            return [];
        }
        providerToUse = availableProviders[Math.floor(Math.random() * availableProviders.length)];
    }

    try {
      let fetchedApiImages: ApiImage[] = [];
      switch (providerToUse) {
        case 'unsplash':
          if (!unsplashKey) { setSlideshowApiError("Unsplash API Key missing."); break; }
          const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(slideshowKeyword)}&per_page=${API_IMAGE_COUNT}&orientation=landscape&client_id=${unsplashKey}`);
          if (!unsplashRes.ok) throw new Error(`Unsplash API error (${unsplashRes.status})`);
          const unsplashData: UnsplashSearchResponse = await unsplashRes.json();
          fetchedApiImages = unsplashData.results.map((img): ApiImage => ({
            id: img.id, url: img.urls.regular, description: img.alt_description || img.description || undefined,
            artistName: img.user.name, artistUrl: img.user.links.html,
            sourceName: 'unsplash', sourceUrl: img.links.html, location: img.user.location || undefined,
            color: img.color || undefined, width: img.width, height: img.height,
          }));
          break;
        case 'pexels':
          if (!pexelsKey) { setSlideshowApiError("Pexels API Key missing."); break; }
          const pexelsRes = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(slideshowKeyword)}&per_page=${API_IMAGE_COUNT}&orientation=landscape`, { headers: { Authorization: pexelsKey } });
          if (!pexelsRes.ok) throw new Error(`Pexels API error (${pexelsRes.status})`);
          const pexelsData: PexelsSearchResponse = await pexelsRes.json();
          fetchedApiImages = pexelsData.photos.map((img): ApiImage => ({
            id: img.id.toString(), url: img.src.large2x || img.src.large, description: img.alt || undefined,
            artistName: img.photographer, artistUrl: img.photographer_url,
            sourceName: 'pexels', sourceUrl: img.url, color: img.avg_color || undefined,
            width: img.width, height: img.height,
          }));
          break;
        case 'pixabay':
          if (!pixabayKey) { setSlideshowApiError("Pixabay API Key missing."); break; }
          const pixabayRes = await fetch(`https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(slideshowKeyword)}&image_type=photo&per_page=${API_IMAGE_COUNT}&orientation=horizontal`);
          if (!pixabayRes.ok) throw new Error(`Pixabay API error (${pixabayRes.status})`);
          const pixabayData: PixabaySearchResponse = await pixabayRes.json();
          fetchedApiImages = pixabayData.hits.map((img): ApiImage => ({
            id: img.id.toString(), url: img.largeImageURL, description: img.tags,
            artistName: img.user, artistUrl: `https://pixabay.com/users/${img.user}-${img.user_id}/`,
            sourceName: 'pixabay', sourceUrl: img.pageURL,
            width: img.imageWidth, height: img.imageHeight,
          }));
          break;
      }
      if (fetchedApiImages.length === 0 && !slideshowApiError) {
        setSlideshowApiError(`No images found for "${slideshowKeyword}" from ${providerToUse}.`);
      }
      return fetchedApiImages;
    } catch (error: unknown) {
      console.error("API Fetch Error:", error);
      setSlideshowApiError(error instanceof Error ? `API Error: ${error.message}` : "Unknown API error.");
      return [];
    } finally {
      setIsLoadingApiImages(false);
    }
  }, [slideshowKeyword, slideshowProvider]);

  const actualSlideshowMode = slideshowModeSetting === 'history' && sharedHistory.length < MIN_HISTORY_FOR_SLIDESHOW ? 'api' : slideshowModeSetting || 'api';

  // Effect for initializing or changing slideshow source (API vs History)
  useEffect(() => {
    if (isSlideshowActive) {
      if (actualSlideshowMode === 'history') {
        // This branch depends on sharedHistory
        if (sharedHistory.length >= MIN_HISTORY_FOR_SLIDESHOW) {
          const historyAsApiImages: ApiImage[] = sharedHistory.map(h => ({
            id: h.id, url: h.url, description: h.name, sourceName: 'history', artistName: 'You (History)'
          }));
          setSlideshowImages(historyAsApiImages);
          setSlideshowApiError(null);
          // Ensure playing state is set correctly based on images
          setIsSlideshowPlaying(historyAsApiImages.length > 0);
        } else {
          setSlideshowImages([]);
          setSlideshowApiError(`Not enough history images. Need ${MIN_HISTORY_FOR_SLIDESHOW}.`);
          setIsSlideshowPlaying(false);
        }
        setCurrentSlideshowIndex(0);
        setImageAnimationKey(Date.now());
      } else if (actualSlideshowMode === 'api') {
        // This branch should NOT re-run if only sharedHistory changes.
        fetchApiImages().then(images => {
          setSlideshowImages(images);
          // Ensure playing state is set correctly based on images
          setIsSlideshowPlaying(images.length > 0);
        });
        setCurrentSlideshowIndex(0);
        setImageAnimationKey(Date.now());
      }
    } else {
      setIsSlideshowPlaying(false);
    }
  }, [
    isSlideshowActive,
    actualSlideshowMode, // If this changes, we need to re-evaluate
    fetchApiImages,      // If keyword/provider changes, this callback changes
    // Conditionally include sharedHistory ONLY if mode is 'history'
    // This prevents re-fetching API images when history is updated by slideshow
    ...(actualSlideshowMode === 'history' ? [sharedHistory] : [])
  ]);


  // Effect for advancing the slideshow timer
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isSlideshowActive && isSlideshowPlaying && slideshowImages.length > 0) {
      timerRef.current = setTimeout(() => {
        setCurrentSlideshowIndex(prevIndex => (prevIndex + 1) % slideshowImages.length);
        setImageAnimationKey(Date.now());
      }, slideshowInterval);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isSlideshowActive, isSlideshowPlaying, slideshowImages, currentSlideshowIndex, slideshowInterval]);

  const currentSlide = slideshowImages[currentSlideshowIndex];

  // Effect for adding API slideshow images to history
  useEffect(() => {
    if (
      isSlideshowActive &&
      isSlideshowPlaying &&
      currentSlide && // currentSlide is available
      actualSlideshowMode === 'api' && // Only for API mode
      currentSlide.sourceName !== 'history' && // Defensive check
      currentSlide.url && // Ensure URL exists
      currentSlide.url !== lastAddedToHistoryUrlRef.current // Only add if it's a new URL
    ) {
      const imageName = currentSlide.description || currentSlide.artistName || "Slideshow Image";
      const newGlobalHistory = addImageToHistoryHelper(sharedHistory, currentSlide.url, imageName);
      onSharedHistoryChange(newGlobalHistory);
      lastAddedToHistoryUrlRef.current = currentSlide.url; // Mark as added
    }

    // Reset ref if slideshow stops/pauses or currentSlide becomes undefined
    if (!isSlideshowActive || !isSlideshowPlaying || !currentSlide) {
        if (lastAddedToHistoryUrlRef.current !== null) { // Avoid unnecessary ref update
            lastAddedToHistoryUrlRef.current = null;
        }
    }
  }, [
      currentSlide, // Primary trigger for new images
      isSlideshowActive,
      isSlideshowPlaying,
      actualSlideshowMode,
      sharedHistory, // addImageToHistoryHelper needs the current state of history
      onSharedHistoryChange // Function to call to update history
  ]);


  const handleSlideshowControl = (action: 'play' | 'pause' | 'stop' | 'next' | 'prev') => {
    if (!isSlideshowActive && action !== 'stop') return;
    if (timerRef.current) clearTimeout(timerRef.current);

    switch (action) {
      case 'play': if (slideshowImages.length > 0) setIsSlideshowPlaying(true); break;
      case 'pause': setIsSlideshowPlaying(false); break;
      case 'stop':
        updateInstanceSettings({ isSlideshowActive: false });
        setIsSlideshowPlaying(false);
        setSlideshowImages([]); // Clear images on stop
        break;
      case 'next':
      case 'prev':
        if (slideshowImages.length > 0) {
            setCurrentSlideshowIndex(prev => {
                const newIndex = action === 'next' ? prev + 1 : prev - 1;
                return (newIndex + slideshowImages.length) % slideshowImages.length;
            });
            setImageAnimationKey(Date.now());
            // If slideshow was paused and user navigates, keep it paused.
            // If it was playing, the main timer useEffect will restart the timer.
        }
        break;
    }
  };

  const commonButtonClass = `absolute z-30 p-2 rounded-full backdrop-blur-md bg-black/20 hover:bg-black/40 text-white/80 hover:text-white
                           opacity-0 group-hover:opacity-100 focus-within:opacity-100
                           transition-all duration-300 ease-in-out
                           transform scale-90 group-hover:scale-100
                           focus:opacity-100 focus:scale-105 active:scale-95`;

  const slideshowControlButtonClass = "p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white/90 hover:text-white transition-all duration-200 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 shadow-lg backdrop-blur-sm";

  const renderSlideMetadata = () => {
    if (!currentSlide) return null;
    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white text-xs z-10 transition-opacity duration-500 ease-out opacity-0 group-hover:opacity-100 pointer-events-none animate-slideUpFadeIn">
            {currentSlide.description && (
                <p className="font-semibold text-sm truncate mb-1" title={currentSlide.description}>
                    {currentSlide.description}
                </p>
            )}
            {(currentSlide.artistName || (currentSlide.sourceName !== 'history' && currentSlide.sourceUrl)) && (
                <p className="text-[11px] opacity-80">
                    {currentSlide.artistName && (
                        <>
                            By: <a href={currentSlide.artistUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline pointer-events-auto">{currentSlide.artistName}</a>
                        </>
                    )}
                    {currentSlide.artistName && currentSlide.sourceName !== 'history' && currentSlide.sourceUrl && ' on '}
                    {currentSlide.sourceName !== 'history' && currentSlide.sourceUrl && (
                        <a href={currentSlide.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline capitalize pointer-events-auto">{currentSlide.sourceName}</a>
                    )}
                </p>
            )}
            {currentSlide.location && <p className="text-[10px] opacity-70 mt-0.5">Location: {currentSlide.location}</p>}
        </div>
    );
  };

  return (
    <>
    <style jsx global>{`
        @keyframes kenBurnsEffect {
          0% { transform: scale(1) translate(0, 0); opacity: 0.7; }
          25% { opacity: 1; } /* Fade in quickly */
          100% { transform: scale(1.15) translate(-2%, 2%); opacity: 1; } /* Slow zoom and pan */
        }
        .animate-kenBurns {
          animation: kenBurnsEffect ${slideshowInterval / 1000 + 2}s infinite alternate ease-in-out; /* Duration slightly longer than interval */
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.03); }
        }
        .animate-subtlePulse { animation: subtlePulse 3s infinite ease-in-out; }

        @keyframes slideUpFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUpFadeIn { animation: slideUpFadeIn 0.5s 0.2s ease-out forwards; } /* Delay allows image to load */

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }

        .sidebar-transition { transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .history-item-hover:hover {
            background-color: rgba(var(--color-accent-rgb, 30, 144, 255), 0.15); /* Use accent color with low opacity */
            transform: translateX(4px);
        }
        .input-glow-focus:focus-within {
            box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb, 30, 144, 255), 0.5), 0 0 15px rgba(var(--color-accent-rgb, 30, 144, 255), 0.3);
        }
      `}</style>
    <div className="w-full h-full flex text-primary dark:text-slate-100 overflow-hidden relative bg-slate-800 dark:bg-slate-900 shadow-2xl rounded-lg group"
         style={{ '--color-accent-rgb': '30, 144, 255' } as React.CSSProperties} // Example accent, can be dynamic
    >
      <div
        className={`absolute top-0 left-0 h-full bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-2xl z-40 sidebar-transition flex flex-col
                    ${isSidebarOpen ? 'translate-x-0 w-64 sm:w-72' : '-translate-x-full w-64 sm:w-72'}`}
        aria-hidden={!isSidebarOpen}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700 dark:border-slate-800/70">
          <h3 className="text-md font-semibold text-slate-100 dark:text-slate-200">Image History</h3>
          <button onClick={toggleSidebar} className="p-1.5 rounded-full hover:bg-slate-700 dark:hover:bg-slate-700/50 text-slate-400 hover:text-slate-100 transition-all duration-150 active:scale-90" aria-label="Close image history sidebar">
            <ChevronLeftIcon />
          </button>
        </div>
        {sharedHistory.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 p-6 text-center italic animate-fadeIn">History is pristine.</p>
        ) : (
          <div className="flex-grow overflow-y-auto p-2.5 space-y-2 scrollbar-thin scrollbar-thumb-slate-600 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {sharedHistory.map((histItem, index) => (
              <button
                key={histItem.id}
                onClick={() => { handleSetImage(histItem.url, histItem.name); }}
                className="w-full flex items-center p-2.5 rounded-lg hover:shadow-md focus:bg-slate-700 dark:focus:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-accent-primary/70 transition-all duration-200 ease-out text-left group relative history-item-hover animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms`}}
                title={`Load: ${histItem.name || 'Unnamed Image'}\nAdded: ${new Date(histItem.timestamp).toLocaleDateString()}`}
                aria-label={`Load image ${histItem.name || 'Unnamed Image'}`}
              >
                <div className="w-12 h-12 mr-3 flex-shrink-0 bg-slate-700 dark:bg-slate-800 border border-slate-600 dark:border-slate-700/50 rounded-md relative overflow-hidden shadow-sm">
                  <Image src={histItem.url} alt={histItem.name || 'History thumbnail'} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
                </div>
                <span className="text-sm text-slate-200 dark:text-slate-300 group-hover:text-white dark:group-hover:text-slate-100 transition-colors truncate flex-grow">
                  {histItem.name || 'Unnamed Image'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 dark:from-slate-900 dark:via-black/50 dark:to-slate-950 p-1.5 sm:p-2 relative">
         {!isSidebarOpen && (
            <button
            onClick={toggleSidebar}
            className={`${commonButtonClass} top-3 left-3 bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 hover:text-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-700/70 dark:text-slate-400 dark:hover:text-slate-200 shadow-md`}
            title="Open Image History" aria-label="Open image history sidebar"
            > <HistoryIcon /> </button>
         )}

        {isSlideshowActive ? (
          <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden rounded-md"> {/* Added overflow-hidden for Ken Burns */}
            {isLoadingApiImages && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 animate-fadeIn" aria-live="polite">
                <svg className="animate-spin h-12 w-12 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-slate-200 dark:text-slate-300 text-md tracking-wider">Evoking Visuals...</p>
              </div>
            )}
            {slideshowApiError && !isLoadingApiImages && slideshowImages.length === 0 && (
                 <div className="text-center text-amber-500 dark:text-amber-400 p-6 flex flex-col items-center justify-center animate-fadeIn" role="alert">
                    <BaseImageIcon className="text-amber-500/70 dark:text-amber-400/70 mb-3 w-20 h-20 opacity-60" />
                    <p className="mt-2 text-lg font-semibold">Slideshow Interrupted</p>
                    <p className="text-sm max-w-md opacity-90">{slideshowApiError}</p>
                    <button onClick={() => handleSlideshowControl('stop')} className="mt-6 px-5 py-2.5 bg-accent-primary text-white rounded-lg hover:bg-opacity-80 text-sm font-medium shadow-lg transition-all active:scale-95" aria-label="Exit slideshow">
                        Return to Stillness
                    </button>
                 </div>
            )}

            {currentSlide && (
              <div className="w-full h-full relative bg-black overflow-hidden rounded-md">
                <Image
                  key={imageAnimationKey} // Use animation key here
                  src={currentSlide.url}
                  alt={currentSlide.description || 'Slideshow image'}
                  layout="fill"
                  objectFit="cover"
                  priority
                  className={`
                    ${slideshowTransitionEffect === 'kenBurns' ? 'animate-kenBurns' : 'opacity-0'}
                    transition-opacity duration-1000 ease-in-out
                    ${slideshowTransitionEffect === 'fade' && 'opacity-100'}
                  `}
                  onLoadingComplete={(img) => {
                    if (slideshowTransitionEffect === 'fade') {
                      img.style.opacity = '0';
                      setTimeout(() => img.style.opacity = '1', 50); // Slight delay for fade-in
                    }
                  }}
                  onError={() => {
                    console.warn(`Error loading slideshow image: ${currentSlide.url}. Skipping.`);
                    handleSlideshowControl('next'); // Skip to next image on error
                  }}
                />
                {renderSlideMetadata()}
              </div>
            )}

            {slideshowImages.length > 0 && (
                <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center space-x-3 sm:space-x-4 p-2 bg-black/50 backdrop-blur-md rounded-xl shadow-2xl z-20 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                <button onClick={() => handleSlideshowControl('prev')} className={slideshowControlButtonClass} title="Previous" aria-label="Previous image" disabled={slideshowImages.length <= 1}> <PrevIcon /> </button>
                {isSlideshowPlaying ? (
                    <button onClick={() => handleSlideshowControl('pause')} className={slideshowControlButtonClass} title="Pause" aria-label="Pause slideshow"> <PauseIcon /> </button>
                ) : (
                    <button onClick={() => handleSlideshowControl('play')} className={slideshowControlButtonClass} title="Play" aria-label="Play slideshow" disabled={slideshowImages.length === 0}> <PlayIcon /> </button>
                )}
                <button onClick={() => handleSlideshowControl('next')} className={slideshowControlButtonClass} title="Next" aria-label="Next image" disabled={slideshowImages.length <= 1}> <NextIcon /> </button>
                <button onClick={() => handleSlideshowControl('stop')} className={`${slideshowControlButtonClass} bg-red-600/50 hover:bg-red-500/70`} title="Stop" aria-label="Stop slideshow"> <StopIcon /> </button>
                </div>
            )}
          </div>
        ) : (
          <>
            {currentImageUrl && !imageError && (
                <button onClick={handleRemoveCurrentImage} className={`${commonButtonClass} top-3 right-3 bg-red-700/60 hover:bg-red-600/80 text-red-100 hover:text-white dark:bg-red-800/60 dark:hover:bg-red-700/80 dark:text-red-200 dark:hover:text-white shadow-md`} title="Remove Image" aria-label="Remove current image">
                     <RemoveImageIcon />
                </button>
            )}

            {currentImageUrl && !imageError ? (
              <div className="w-full h-full rounded-lg shadow-xl relative overflow-hidden bg-black animate-fadeIn">
                <Image src={currentImageUrl} alt={currentImageName || 'User image'} layout="fill" objectFit={objectFit} onError={handleImageError} priority className="rounded-lg" />
              </div>
            ) : currentImageUrl && imageError ? (
              <div className="text-center text-red-500 dark:text-red-400 p-6 flex flex-col items-center justify-center animate-fadeIn" role="alert">
                <BaseImageIcon className="text-red-500/60 dark:text-red-400/60 mb-3 w-16 h-16 opacity-70" />
                <p className="mt-2 text-md font-semibold">Image Error</p>
                <p className="text-sm max-w-xs opacity-90">Could not load image. URL might be invalid.</p>
              </div>
            ) : (
              <div className="text-center text-slate-400 dark:text-slate-500 p-6 flex flex-col items-center justify-center space-y-5 w-full max-w-md mx-auto animate-fadeIn">
                <BaseImageIcon className="animate-subtlePulse text-slate-500/70 dark:text-slate-600/70 w-20 h-20" />
                <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-300 dark:text-slate-400">Display Your Vision</p>
                    <p className="text-sm max-w-xs opacity-80">
                    Paste an image URL, upload a file, or immerse in a slideshow.
                    </p>
                </div>
                <form onSubmit={handleUrlInputSubmit} className="w-full flex items-center gap-2.5 input-glow-focus rounded-lg">
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group"> <LinkIcon /> </span>
                    <input type="url" value={internalImageUrlInput} onChange={handleUrlInputChange} placeholder="Image URL..."
                           className="w-full pl-12 pr-3 py-3 bg-slate-200/70 dark:bg-slate-800/70 border border-slate-400/50 dark:border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/80 focus:border-transparent sm:text-sm text-primary dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400/70 transition-all duration-200"
                           aria-label="Image URL input" />
                  </div>
                  <button type="submit" className="px-5 py-3 bg-accent-primary text-white rounded-lg hover:bg-opacity-80 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg active:scale-95" aria-label="Set image from URL">Set</button>
                </form>
                <div className="text-xs text-slate-500 dark:text-slate-600 tracking-wider">OR</div>
                <button onClick={() => fileInputRef.current?.click()}
                        className="group w-full flex items-center justify-center px-5 py-3 bg-slate-200/70 dark:bg-slate-700/60 hover:bg-slate-300/80 dark:hover:bg-slate-600/80 border border-slate-400/50 dark:border-slate-600/50 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                        aria-label="Upload image from file">
                  <UploadIcon /> Upload Image
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" aria-hidden="true" />
                <button onClick={() => updateInstanceSettings({ isSlideshowActive: true })}
                    className="mt-4 group w-full flex items-center justify-center px-5 py-3 bg-sky-600/90 hover:bg-sky-500/90 border border-sky-500/50 rounded-lg text-sm font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                    aria-label="Start slideshow">
                  <SlideshowIcon className="w-5 h-5 mr-2.5" /> Start Slideshow
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default PhotoWidget;
