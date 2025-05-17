// src/components/PhotoWidget.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Interfaces & Types ---
export interface HistoricImage {
  id: string;
  url: string;
  name?: string;
  timestamp: number;
}

export interface PhotoWidgetSettings { // Instance-specific settings
  imageUrl?: string | null;
  imageName?: string | null;
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';
  isSidebarOpen?: boolean; // Sidebar visibility is per-instance
}

interface PhotoWidgetProps {
  id: string; // Widget instance ID
  settings?: PhotoWidgetSettings; // Instance-specific settings
  onSettingsChange?: (widgetId: string, newSettings: PhotoWidgetSettings) => void; // To save instance settings

  // Global history props
  sharedHistory: HistoricImage[];
  onSharedHistoryChange: (newHistory: HistoricImage[]) => void;
}

// --- Icons ---
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const BaseImageIcon = ({ className = "" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-12 h-12 text-slate-500 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.158 0a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0zM12 9H9" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const RemoveImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const MAX_HISTORY_ITEMS = 20;
const DEFAULT_OBJECT_FIT = 'cover'; // Default remains 'cover'

// Helper function for managing image history (operates on the shared history)
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
    if (updatedHistory.length > MAX_HISTORY_ITEMS) {
        updatedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);
    }
    return updatedHistory;
};

// --- Settings Panel ---
export const PhotoSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: PhotoWidgetSettings | undefined;
  onSaveInstanceSettings: (newSettings: PhotoWidgetSettings) => void;
  onClearGlobalHistory: () => void;
  globalHistoryLength: number;
}> = ({ widgetId, currentSettings, onSaveInstanceSettings, onClearGlobalHistory, globalHistoryLength }) => {
  const safeInstanceSettings: PhotoWidgetSettings = {
    imageUrl: currentSettings?.imageUrl || null,
    imageName: currentSettings?.imageName || null,
    objectFit: currentSettings?.objectFit || DEFAULT_OBJECT_FIT,
    isSidebarOpen: typeof currentSettings?.isSidebarOpen === 'boolean' ? currentSettings.isSidebarOpen : false,
  };
  const [objectFit, setObjectFit] = useState<'contain' | 'cover' | 'fill' | 'scale-down' | 'none'>(safeInstanceSettings.objectFit);

  useEffect(() => {
    setObjectFit(safeInstanceSettings.objectFit);
  }, [safeInstanceSettings.objectFit]);

  const handleSaveDisplayType = () => {
    onSaveInstanceSettings({ ...safeInstanceSettings, objectFit: objectFit });
  };
  const handleClearCurrentImage = () => {
     onSaveInstanceSettings({ ...safeInstanceSettings, imageUrl: null, imageName: null });
  };

  return (
    <div className="space-y-6 text-primary">
      <div>
        <label htmlFor={`photo-objectfit-${widgetId}`} className="block text-sm font-medium text-secondary mb-1">
          Image Display Style:
        </label>
        <select
          id={`photo-objectfit-${widgetId}`}
          value={objectFit}
          onChange={(e) => setObjectFit(e.target.value as PhotoWidgetSettings['objectFit'])}
          className="mt-1 block w-full px-3 py-2.5 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        >
          <option value="cover">Cover (fill space, may crop)</option>
          <option value="contain">Contain (show whole image)</option>
          <option value="fill">Fill (stretch to fill)</option>
          <option value="scale-down">Scale Down (like contain, or original size if smaller)</option>
          <option value="none">None (original size, may clip)</option>
        </select>
      </div>
      <div className="flex flex-col gap-3 pt-2">
        <button
            onClick={handleSaveDisplayType}
            type="button"
            className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-on-accent bg-accent-primary hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface transition-colors"
        >
            Save Display Style
        </button>
        <button
            onClick={handleClearCurrentImage}
            type="button"
            className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-amber-500/50 text-sm font-medium rounded-md text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-dark-surface transition-colors"
        >
            <TrashIcon /> Clear Current Image
        </button>
        <button
            onClick={() => {
                if (window.confirm("Are you sure you want to clear the GLOBAL image history for ALL photo widgets?")) {
                    onClearGlobalHistory();
                }
            }}
            type="button"
            disabled={globalHistoryLength === 0}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-red-500/50 text-sm font-medium rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-dark-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <TrashIcon /> Clear Global Image History
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
  const isSidebarOpen = typeof settings?.isSidebarOpen === 'boolean' ? settings.isSidebarOpen : false;

  const [internalImageUrlInput, setInternalImageUrlInput] = useState('');
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateInstanceSettings = useCallback((newPartialInstanceSettings: Partial<PhotoWidgetSettings>) => {
    if (onSettingsChange) {
      const currentFullInstanceSettings: PhotoWidgetSettings = {
          imageUrl: currentImageUrl,
          imageName: currentImageName,
          objectFit: objectFit,
          isSidebarOpen: isSidebarOpen,
      };
      const newSettingsPayload: PhotoWidgetSettings = {
        ...currentFullInstanceSettings,
        ...newPartialInstanceSettings,
      };
      onSettingsChange(id, newSettingsPayload);
    }
  }, [onSettingsChange, id, currentImageUrl, currentImageName, objectFit, isSidebarOpen]);

  useEffect(() => {
    setImageError(false);
  }, [currentImageUrl]);

  const handleSetImage = useCallback((url: string, name?: string) => {
    setImageError(false);
    const newGlobalHistory = addImageToHistoryHelper(sharedHistory, url, name);
    onSharedHistoryChange(newGlobalHistory);
    updateInstanceSettings({
      imageUrl: url,
      imageName: name || (url.substring(url.lastIndexOf('/') + 1).split('?')[0].replace(/[^\w\s.-]/gi, '') || "Image"),
    });
    setInternalImageUrlInput('');
  }, [updateInstanceSettings, sharedHistory, onSharedHistoryChange]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSetImage(reader.result as string, file.name);
      };
      reader.onerror = () => { setImageError(true); };
      reader.readAsDataURL(file);
      if (event.target) event.target.value = ""; // Clear the input
    }
  };

  const handleUrlInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInternalImageUrlInput(event.target.value);
  };
  const handleUrlInputSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (internalImageUrlInput.trim()) {
      handleSetImage(internalImageUrlInput.trim());
    }
  };
  const handleImageError = () => { setImageError(true); };
  const toggleSidebar = () => {
    updateInstanceSettings({ isSidebarOpen: !isSidebarOpen });
  };
  const handleRemoveCurrentImage = () => {
    updateInstanceSettings({ imageUrl: null, imageName: null });
  };

  const commonButtonClass = `absolute z-30 p-1.5 rounded-md backdrop-blur-sm
                           opacity-0 group-hover:opacity-100 focus-within:opacity-100
                           transition-all duration-300 ease-in-out 
                           transform scale-95 group-hover:scale-100 
                           pointer-events-none group-hover:pointer-events-auto
                           focus:opacity-100 focus:scale-105 hover:scale-105`;


  return (
    <div className="w-full h-full flex text-primary overflow-hidden relative">
      {/* Image History Sidebar */}
      <div
        className={`absolute top-0 left-0 h-full bg-slate-800/95 backdrop-blur-md shadow-xl z-20 transition-transform duration-300 ease-in-out flex flex-col
                    ${isSidebarOpen ? 'translate-x-0 w-64 sm:w-72' : '-translate-x-full w-64 sm:w-72'}`}
      >
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Global Image History</h3>
          <button onClick={toggleSidebar} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors">
            <ChevronLeftIcon />
          </button>
        </div>
        {sharedHistory.length === 0 ? (
          <p className="text-xs text-slate-400 p-4 text-center italic">Global history is empty.</p>
        ) : (
          <div className="flex-grow overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
            {sharedHistory.map((histItem) => (
              <button
                key={histItem.id}
                onClick={() => { handleSetImage(histItem.url, histItem.name); }}
                className="w-full flex items-center p-2 rounded-md hover:bg-slate-700/70 focus:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-primary/50 transition-colors text-left group"
                title={`Load: ${histItem.name || 'Unnamed'}\nAdded: ${new Date(histItem.timestamp).toLocaleDateString()}`}
              >
                <img
                  src={histItem.url}
                  alt={histItem.name || 'thumbnail'}
                  className="w-10 h-10 object-cover rounded-sm mr-2.5 flex-shrink-0 bg-slate-700 border border-slate-600"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40/4A5568/A0AEC0?text=Err&font=sans-serif";}}
                />
                <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors truncate flex-grow">
                  {histItem.name || 'Unnamed Image'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area - Added 'group' for hover effects on child buttons */}
      <div className="flex-grow flex flex-col items-center justify-center bg-slate-900/60 p-2 relative group">
        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`${commonButtonClass} top-2 left-2 bg-slate-700/70 hover:bg-slate-600/80 text-slate-300 hover:text-slate-100`}
          title="Open/Close Image History"
        >
          <HistoryIcon />
        </button>

        {/* Remove Current Image Button */}
        {currentImageUrl && !imageError && (
            <button
                onClick={handleRemoveCurrentImage}
                className={`${commonButtonClass} top-2 right-2 bg-red-700/70 hover:bg-red-600/80 text-red-100 hover:text-white`}
                title="Remove Current Image (this instance)"
            >
                <RemoveImageIcon />
            </button>
        )}

        {currentImageUrl && !imageError ? (
          <img
            src={currentImageUrl}
            alt={currentImageName || 'User image'}
            // Apply w-full and h-full to make the image element itself fill its container.
            // object-fit will then determine how the image content behaves within that box.
            className="w-full h-full rounded-md shadow-lg" 
            style={{ objectFit: objectFit }} 
            onError={handleImageError}
            loading="lazy"
          />
        ) : currentImageUrl && imageError ? (
          <div className="text-center text-red-400 p-4 flex flex-col items-center justify-center">
            <BaseImageIcon className="text-red-500/70 mb-2" />
            <p className="mt-2 text-sm font-semibold">Error Loading Image</p>
            <p className="text-xs max-w-xs break-all">URL might be invalid or image unavailable. <br/> <span className="text-red-500/80 text-[10px]">{currentImageUrl.substring(0,100)}{currentImageUrl.length > 100 ? '...' : ''}</span></p>
          </div>
        ) : (
          <div className="text-center text-slate-400 p-4 flex flex-col items-center justify-center space-y-4 w-full">
            <BaseImageIcon className="animate-subtle-pulse text-slate-500/80" />
            <p className="text-sm font-medium">No Image Set</p>
            <p className="text-xs max-w-xs">
              Enter an image URL below, upload a file, or select from global history.
            </p>
            <form onSubmit={handleUrlInputSubmit} className="w-full max-w-sm flex items-center gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LinkIcon />
                </div>
                <input
                  type="url"
                  value={internalImageUrlInput}
                  onChange={handleUrlInputChange}
                  placeholder="Paste image URL here"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-700/80 border border-slate-600/70 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary placeholder-slate-400/80 transition-colors"
                />
              </div>
              <button type="submit" className="px-4 py-2.5 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover text-sm font-medium transition-colors shadow-md hover:shadow-lg">Set</button>
            </form>
            <div className="text-xs text-slate-500">OR</div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group w-full max-w-sm flex items-center justify-center px-4 py-2.5 bg-slate-700/80 hover:bg-slate-600/90 border border-slate-600/70 rounded-md text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors shadow-md hover:shadow-lg"
            >
              <UploadIcon /> Upload Image File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoWidget;
