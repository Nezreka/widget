// src/components/YoutubeWidget.tsx
"use client";

import React, { useState, FormEvent, useEffect, useCallback} from 'react'; // Ensured useRef is imported
import Image from 'next/image';

// --- Constants ---
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY // User provided key. WARNING: Exposing API keys on the client side is insecure.

// --- Icons ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>;
const YoutubePlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-slate-600 group-hover:text-red-500 transition-colors"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M14.78 11.78a.75.75 0 0 1-1.06 0L10 8.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" /></svg>;


// --- Interfaces & Types ---
export interface YoutubeWidgetSettings {
  defaultSearchQuery?: string;
  maxResults?: number;
  showResultsPanel?: boolean;
}

interface YouTubeSearchResultItem {
  id: { videoId: string; };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number; };
      medium?: { url: string; width: number; height: number; };
      high?: { url: string; width: number; height: number; };
    };
    channelTitle?: string;
    publishedAt?: string;
  };
}

interface YoutubeWidgetProps {
  settings?: YoutubeWidgetSettings;
  id: string; 
}

interface YoutubeSettingsPanelProps {
  widgetId: string;
  currentSettings: YoutubeWidgetSettings | undefined;
  onSave: (newSettings: YoutubeWidgetSettings) => void;
}

// --- YouTube Settings Panel ---
export const YoutubeSettingsPanel: React.FC<YoutubeSettingsPanelProps> = ({
  widgetId, currentSettings, onSave,
}) => {
  const [defaultSearchQuery, setDefaultSearchQuery] = useState(currentSettings?.defaultSearchQuery || '');
  const [maxResults, setMaxResults] = useState(currentSettings?.maxResults || 10);
  const [showResultsPanelConfig, setShowResultsPanelConfig] = useState(currentSettings?.showResultsPanel === undefined ? true : currentSettings.showResultsPanel);

  const handleSaveClick = () => {
    onSave({
        defaultSearchQuery: defaultSearchQuery.trim(),
        maxResults: Math.max(1, Math.min(25, maxResults)),
        showResultsPanel: showResultsPanelConfig,
    });
  };

  return (
    <div className="space-y-4 text-primary">
      <div>
        <label htmlFor={`youtube-default-query-${widgetId}`} className="block text-sm font-medium text-secondary mb-1">
          Default Search Query (optional):
        </label>
        <input
          type="text" id={`youtube-default-query-${widgetId}`} value={defaultSearchQuery}
          onChange={(e) => setDefaultSearchQuery(e.target.value)} placeholder="e.g., 'Tech Reviews'"
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        />
      </div>
      <div>
        <label htmlFor={`youtube-max-results-${widgetId}`} className="block text-sm font-medium text-secondary mb-1">
          Max Search Results (1-25):
        </label>
        <input
          type="number" id={`youtube-max-results-${widgetId}`} value={maxResults}
          onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
          min="1" max="25"
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        />
      </div>
       <div>
        <label htmlFor={`youtube-show-results-${widgetId}`} className="flex items-center text-sm font-medium text-secondary cursor-pointer">
          <input
            type="checkbox" id={`youtube-show-results-${widgetId}`} checked={showResultsPanelConfig}
            onChange={(e) => setShowResultsPanelConfig(e.target.checked)}
            className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget"
          />
          Show Search Results Panel by Default
        </label>
      </div>
      <button
        onClick={handleSaveClick}
        className="mt-6 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface"
      >
        Save YouTube Settings
      </button>
    </div>
  );
};

// --- Main YoutubeWidget Component ---
const YoutubeWidget: React.FC<YoutubeWidgetProps> = ({ settings }) => { 
  const [searchQuery, setSearchQuery] = useState(settings?.defaultSearchQuery || '');
  const [searchResults, setSearchResults] = useState<YouTubeSearchResultItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResultsPanelVisible, setIsResultsPanelVisible] = useState(settings?.showResultsPanel === undefined ? true : settings.showResultsPanel);
  
  const maxResultsCount = settings?.maxResults || 10;

  const fetchSearchResults = useCallback(async (query: string) => {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY_PLACEHOLDER_IF_YOU_REVERT') {
      setError("YouTube API Key is not configured correctly.");
      setIsLoading(false);
      setSearchResults([]);
      return;
    }
    if (!query.trim()) {
      setSearchResults([]); // Clear results if query is empty
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResultsCount}&q=${encodeURIComponent(query.trim())}&key=${YOUTUBE_API_KEY}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.error("YouTube API Error Response:", errorData);
        let message = `API Error: ${response.status}`;
        if (errorData.error && errorData.error.message) {
            message = errorData.error.message;
        }
        throw new Error(message);
      }
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (err: unknown) {
      console.error("YouTube API search error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching results. Check API key and quota.");
      }
      setSearchResults([]);
      setSelectedVideoId(null);
    } finally {
      setIsLoading(false);
    }
  }, [maxResultsCount]);

  // Effect 1: Sync settings.defaultSearchQuery prop to internal searchQuery state
  useEffect(() => {
    const newQueryFromSettings = settings?.defaultSearchQuery;
    console.log(`[YT Widget Sync Effect] settings.defaultSearchQuery: "${newQueryFromSettings}", current searchQuery state: "${searchQuery}"`);
    
    // If the prop has a value and it's different from the current internal state, update the internal state.
    // This handles both initial load (if settings.defaultSearchQuery is present) and subsequent updates from AI.
    if (newQueryFromSettings !== undefined && newQueryFromSettings !== searchQuery) {
        console.log(`[YT Widget Sync Effect] Updating searchQuery state to: "${newQueryFromSettings}"`);
        setSearchQuery(newQueryFromSettings);
    }
    // If the prop becomes undefined (or was initially undefined) and searchQuery is not empty,
    // it means a default was removed or never existed. We don't clear user's current input in this case.
    // If newQueryFromSettings is an empty string and differs, searchQuery will be set to ""
    
  }, [settings?.defaultSearchQuery, searchQuery]); // searchQuery is in dependency to re-evaluate if it externally changes while prop is same (less common)


  // Effect 2: Fetch results when internal searchQuery state changes and is non-empty
  useEffect(() => {
    console.log(`[YT Widget Fetch Effect] searchQuery state is now: "${searchQuery}". Checking if fetch is needed.`);
    if (searchQuery.trim()) {
        console.log(`[YT Widget Fetch Effect] searchQuery is non-empty. Fetching results for: "${searchQuery}"`);
        fetchSearchResults(searchQuery);
        setIsResultsPanelVisible(true); // Show results panel when a search is made
    } else {
        // If searchQuery becomes empty (e.g., user clears input, or defaultSearchQuery was empty string)
        // fetchSearchResults('') will handle clearing results.
        // We might also want to hide panel or clear selected video if search query is cleared.
        console.log(`[YT Widget Fetch Effect] searchQuery is empty. Clearing results (via fetchSearchResults with empty query).`);
        fetchSearchResults(''); // This will clear results as per its internal logic
        // setSelectedVideoId(null); // Optionally clear selected video
        // setIsResultsPanelVisible(settings?.showResultsPanel === undefined ? true : settings.showResultsPanel); // Reset to default visibility or keep as is
    }
  }, [searchQuery, fetchSearchResults]); // Only depends on searchQuery (internal state) and the memoized fetcher


  // Effect to handle changes in settings.showResultsPanel
  useEffect(() => {
    if (settings?.showResultsPanel !== undefined) {
        setIsResultsPanelVisible(settings.showResultsPanel);
    }
  }, [settings?.showResultsPanel]);


  const getVideoEmbedUrl = (videoId: string | null): string => {
    if (!videoId) return '';
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  };

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // fetchSearchResults is already called by the useEffect hook when searchQuery changes.
    // This explicit call might be redundant if the state update from input onChange is immediate enough.
    // However, it ensures search on explicit submit if state update hasn't triggered effect yet.
    // For safety and explicitness on user action:
    if (searchQuery.trim()) {
        fetchSearchResults(searchQuery);
        setIsResultsPanelVisible(true);
    } else {
        fetchSearchResults(''); // Clear results if submitted empty
    }
  };

  const toggleResultsPanel = () => setIsResultsPanelVisible(prev => !prev);

  const shouldRenderResultsArea = searchQuery.trim() || isLoading || error || searchResults.length > 0;


  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden rounded-lg shadow-xl">
      <form onSubmit={handleSearchSubmit} className="p-3 flex items-center space-x-2 bg-slate-800/70 backdrop-blur-sm shrink-0 border-b border-slate-700/50">
        <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <SearchIcon />
            </div>
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search YouTube..."
              className="w-full pl-10 pr-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-slate-50 placeholder-slate-400 transition-colors"
              aria-label="YouTube search query"
            />
        </div>
        <button
          type="submit"
          disabled={isLoading || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY_PLACEHOLDER_IF_YOU_REVERT'}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'Search'}
        </button>
      </form>

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden min-h-0">
        <div className={`bg-black shrink-0 transition-all duration-300 ease-in-out relative
                        ${shouldRenderResultsArea && isResultsPanelVisible ? 'w-full md:w-[calc(100%-16rem)] lg:w-[calc(100%-20rem)] h-1/2 md:h-full' : 'w-full h-full'}`}>
          {selectedVideoId ? (
            <iframe
              key={selectedVideoId} src={getVideoEmbedUrl(selectedVideoId)} title="YouTube Video Player"
              width="100%" height="100%" frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen className="bg-black"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center group cursor-default">
              <YoutubePlayIcon />
              <p className="font-semibold mt-2">No video selected</p>
              <p className="text-sm text-slate-500">Search and click a video to play.</p>
            </div>
          )}
        </div>

        {shouldRenderResultsArea && (
          <div className={`bg-slate-900 border-t md:border-t-0 md:border-l border-slate-700/50 flex flex-col
                           transition-all duration-300 ease-in-out overflow-hidden
                           ${isResultsPanelVisible ? 'w-full md:w-64 lg:w-80 h-1/2 md:h-full opacity-100' : 'w-full md:w-12 h-auto md:h-full opacity-100 md:py-2 flex items-center md:items-start justify-center'}`}>

            <button
              onClick={toggleResultsPanel}
              className="w-full flex items-center justify-center md:justify-between p-2.5 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 transition-colors text-xs shrink-0 sticky top-0 z-10 md:relative md:border-b md:border-slate-700/50"
              title={isResultsPanelVisible ? "Hide Results" : "Show Results"}
            >
              <span className="md:hidden flex items-center">
                {isResultsPanelVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
                <span className="ml-1.5">{isResultsPanelVisible ? "Hide Results" : "Show Results"}</span>
              </span>
              <span className="hidden md:flex items-center justify-between w-full">
                <span className={`${!isResultsPanelVisible ? 'hidden' : ''}`}>{isResultsPanelVisible ? "Hide Results" : ""}</span>
                {isResultsPanelVisible ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </span>
            </button>

            {isResultsPanelVisible && (
              <div className="flex-grow overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                {isLoading && <p className="text-slate-400 text-sm p-3 text-center">Loading results...</p>}
                {error && <p className="text-red-400 text-sm p-3 text-center">Error: {error}</p>}
                {!isLoading && !error && searchResults.length === 0 && searchQuery.trim() && (
                  <p className="text-slate-400 text-sm p-3 text-center">No results for &quot;{searchQuery}&quot;.</p>
                )}
                {!isLoading && !error && searchResults.length === 0 && !searchQuery.trim() && (
                  <p className="text-slate-400 text-sm p-3 text-center">Enter a search to see videos.</p>
                )}
                {searchResults.map((item) => (
                  <div
                    key={item.id.videoId}
                    className={`flex items-start space-x-2.5 cursor-pointer hover:bg-slate-700/70 p-2 rounded-lg transition-all duration-150 ease-in-out
                                ${selectedVideoId === item.id.videoId ? 'bg-slate-700 ring-2 ring-red-500/70 shadow-lg' : 'bg-slate-800/60 hover:shadow-md'}`}
                    onClick={() => setSelectedVideoId(item.id.videoId)} title={item.snippet.title}
                  >
                    <Image
                      src={item.snippet.thumbnails.default.url} alt={item.snippet.title}
                      width={item.snippet.thumbnails.default.width || 96}
                      height={item.snippet.thumbnails.default.height || 54}
                      className="rounded-md flex-shrink-0 object-cover bg-slate-700 border border-slate-600/50"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/96x54/1E293B/94A3B8?text=No+Thumb&font=sans'; }}
                      unoptimized={true}
                    />
                    <div className="overflow-hidden flex-grow">
                      <h4 className="text-xs font-semibold text-slate-100 line-clamp-2" title={item.snippet.title}>
                        {item.snippet.title}
                      </h4>
                      {item.snippet.channelTitle && <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.snippet.channelTitle}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default YoutubeWidget;
