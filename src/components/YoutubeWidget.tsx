// src/components/YoutubeWidget.tsx
"use client";

import React, { useState, FormEvent, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

// --- Constants ---
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY // User provided key. WARNING: Exposing API keys on the client side is insecure.

// --- Icons ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>;
const YoutubePlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-gray-500 group-hover:text-red-600 transition-colors"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M14.78 11.78a.75.75 0 0 1-1.06 0L10 8.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" /></svg>;


// --- Interfaces & Types ---
export interface YoutubeWidgetSettings {
  defaultSearchQuery?: string;
  maxResults?: number;
  showResultsPanel?: boolean;
}

interface YouTubeSearchResultItem {
  id: {
    kind: string; // "youtube#video" or "youtube#playlist"
    videoId?: string;
    playlistId?: string;
  };
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
  contentDetails?: { // For playlists
    itemCount: number;
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
    <div className="space-y-4 text-gray-100">
      <div>
        <label htmlFor={`youtube-default-query-${widgetId}`} className="block text-sm font-medium text-gray-300 mb-1">
          Default Search Query (optional):
        </label>
        <input
          type="text" id={`youtube-default-query-${widgetId}`} value={defaultSearchQuery}
          onChange={(e) => setDefaultSearchQuery(e.target.value)} placeholder="e.g., 'Tech Reviews'"
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-100 placeholder-gray-400"
        />
      </div>
      <div>
        <label htmlFor={`youtube-max-results-${widgetId}`} className="block text-sm font-medium text-gray-300 mb-1">
          Max Search Results (1-25):
        </label>
        <input
          type="number" id={`youtube-max-results-${widgetId}`} value={maxResults}
          onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
          min="1" max="25"
          className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-100"
        />
      </div>
       <div>
        <label htmlFor={`youtube-show-results-${widgetId}`} className="flex items-center text-sm font-medium text-gray-300 cursor-pointer">
          <input
            type="checkbox" id={`youtube-show-results-${widgetId}`} checked={showResultsPanelConfig}
            onChange={(e) => setShowResultsPanelConfig(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded mr-2 bg-gray-700"
          />
          Show Search Results Panel by Default
        </label>
      </div>
      <button
        onClick={handleSaveClick}
        className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800"
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video,playlist&maxResults=${maxResultsCount}&q=${encodeURIComponent(query.trim())}&key=${YOUTUBE_API_KEY}`
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
    
    if (newQueryFromSettings !== undefined && newQueryFromSettings !== searchQuery) {
        setSearchQuery(newQueryFromSettings);
    }
  }, [settings?.defaultSearchQuery, searchQuery]);

  // Effect 2: Debounce search query and fetch results
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSearchResults(searchQuery);
        setIsResultsPanelVisible(true);
      }, 500); // Debounce for 500ms
    } else {
      // Only clear results if the query is empty, but don't stop playing video
      fetchSearchResults('');
      // Optionally reset visibility if the default is to hide when empty
      setIsResultsPanelVisible(settings?.showResultsPanel === undefined ? true : settings.showResultsPanel);
      // Do NOT clear selectedVideoId here, as user wants video to keep playing
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, fetchSearchResults, settings?.showResultsPanel]);

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

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current); // Clear any pending debounced search
    }
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
    <div className="w-full h-full flex flex-col bg-gray-950 text-gray-100 overflow-hidden rounded-lg shadow-xl border border-gray-800">
      <form onSubmit={handleSearchSubmit} className="p-3 flex items-center space-x-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <SearchIcon />
            </div>
            <input
              type="text" value={searchQuery} onChange={handleSearchInputChange}
              placeholder="Search YouTube..."
              className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm text-gray-100 placeholder-gray-400 transition-colors"
              aria-label="YouTube search query"
            />
        </div>
        <button
          type="submit"
          disabled={isLoading || !YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY_PLACEHOLDER_IF_YOU_REVERT'}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
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
        <div className={`bg-gray-900 shrink-0 transition-all duration-300 ease-in-out relative
                        ${shouldRenderResultsArea && isResultsPanelVisible ? 'w-full md:w-[calc(100%-18rem)] h-1/2 md:h-full' : 'w-full h-full'}`}>
          {selectedVideoId ? (
            <iframe
              key={selectedVideoId} src={getVideoEmbedUrl(selectedVideoId)} title="YouTube Video Player"
              width="100%" height="100%" frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen className="bg-black"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center group cursor-default">
              <YoutubePlayIcon />
              <p className="font-semibold mt-2">No video selected</p>
              <p className="text-sm text-gray-500">Search and click a video to play.</p>
            </div>
          )}
        </div>

        {shouldRenderResultsArea && (
          <div className={`bg-gray-800 border-t md:border-t-0 md:border-l border-gray-700 flex flex-col
                           transition-all duration-300 ease-in-out overflow-hidden
                           ${isResultsPanelVisible ? 'w-full md:w-72 h-1/2 md:h-full opacity-100' : 'w-full md:w-12 h-auto md:h-full opacity-100 md:py-2 flex items-center md:items-start justify-center'}`}>

            <button
              onClick={toggleResultsPanel}
              className="w-full flex items-center justify-center md:justify-between p-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-100 transition-colors text-xs shrink-0 sticky top-0 z-10 md:relative md:border-b md:border-gray-700"
              title={isResultsPanelVisible ? "Hide Results" : "Show Results"}
            >
              <span className="md:hidden flex items-center">
                {isResultsPanelVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
                <span className="ml-1.5">{isResultsPanelVisible ? "Hide Results" : "Show Results"}</span>
              </span>
              <span className="hidden md:flex items-center justify-between w-full">
                <span className={`${!isResultsPanelVisible ? 'hidden' : ''}`}>{isResultsPanelVisible ? "Hide Results" : ""}</span>
                {isResultsPanelVisible ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </span>
            </button>

            {isResultsPanelVisible && (
              <div className="flex-grow overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {isLoading && <p className="text-gray-400 text-sm p-3 text-center">Loading results...</p>}
                {error && <p className="text-red-400 text-sm p-3 text-center">Error: {error}</p>}
                {!isLoading && !error && searchResults.length === 0 && searchQuery.trim() && (
                  <p className="text-gray-400 text-sm p-3 text-center">{`No results for "${searchQuery}".`}</p>
                )}
                {!isLoading && !error && searchResults.length === 0 && !searchQuery.trim() && (
                  <p className="text-gray-400 text-sm p-3 text-center">Enter a search to see videos.</p>
                )}
                {searchResults.map((item) => {
                  const isVideo = item.id.kind === 'youtube#video';
                  const isPlaylist = item.id.kind === 'youtube#playlist';
                  const itemId = isVideo ? item.id.videoId : item.id.playlistId;
                  const thumbnailUrl = item.snippet.thumbnails.default.url;
                  const title = item.snippet.title;
                  const channelTitle = item.snippet.channelTitle;

                  if (!itemId) return null; // Skip if no valid ID

                  return (
                    <div
                      key={itemId}
                      className={`flex items-start space-x-2.5 cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-all duration-150 ease-in-out
                                  ${selectedVideoId === item.id.videoId ? 'bg-gray-700 ring-2 ring-red-500/70 shadow-lg' : 'bg-gray-800 hover:shadow-md'}`}
                      onClick={() => {
                        if (isVideo && item.id.videoId) {
                          setSelectedVideoId(item.id.videoId);
                        } else if (isPlaylist && item.id.playlistId) {
                          // For playlists, we might want to load the first video or show playlist details
                          // For now, we'll just log it. A more advanced implementation would fetch playlist items.
                          console.log("Playlist selected:", item.id.playlistId);
                          // Optionally, you could set a state to show playlist content instead of playing a video
                          setSelectedVideoId(null); // Clear video if a playlist is selected
                        }
                      }}
                      title={title}
                    >
                      <div className="relative flex-shrink-0">
                        <Image
                          src={thumbnailUrl} alt={title}
                          width={item.snippet.thumbnails.default.width || 96}
                          height={item.snippet.thumbnails.default.height || 54}
                          className="rounded-md object-cover bg-gray-700 border border-gray-600"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/96x54/374151/9CA3AF?text=No+Thumb&font=sans'; }}
                          unoptimized={true}
                        />
                        {isPlaylist && (
                          <div className="absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-[10px] px-1 py-0.5 rounded-br-md">
                            Playlist
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden flex-grow">
                        <h4 className="text-xs font-semibold text-gray-100 line-clamp-2" title={title}>
                          {title}
                        </h4>
                        {channelTitle && <p className="text-[11px] text-gray-400 truncate mt-0.5">{channelTitle}</p>}
                        {isPlaylist && item.contentDetails?.itemCount !== undefined && (
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.contentDetails.itemCount} videos</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default YoutubeWidget;
