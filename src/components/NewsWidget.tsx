// src/components/NewsWidget.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';

// --- Types ---

export interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface NewsWidgetSettings {
  category?: string;
  country?: string;
  keywords?: string;
  articlesToShow?: number;
  updateInterval?: number; // in minutes
  showImages?: boolean;
  showDescription?: boolean;
}

interface NewsWidgetProps {
  id: string;
  settings: NewsWidgetSettings | undefined;
}

// --- Constants ---

const NEWS_CATEGORIES = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
const NEWS_COUNTRIES = ['us', 'gb', 'ca', 'au', 'de', 'fr', 'in', 'jp'];
const DEFAULT_UPDATE_INTERVAL = 15; // 15 minutes

// --- Main Component ---

const NewsWidget: React.FC<NewsWidgetProps> = ({ settings }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (settings?.country) params.append('country', settings.country);
      if (settings?.category) params.append('category', settings.category);
      if (settings?.keywords) params.append('q', settings.keywords);
      if (settings?.articlesToShow) params.append('pageSize', String(settings.articlesToShow));

      const response = await fetch(`/api/news?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch news');
      }
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [settings]);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, (settings?.updateInterval || DEFAULT_UPDATE_INTERVAL) * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews, settings?.updateInterval]);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col text-white">
      {loading && <div className="flex items-center justify-center h-full">Loading news...</div>}
      {error && <div className="flex items-center justify-center h-full text-red-400">{error}</div>}
      {!loading && !error && (
        <div className="h-full overflow-y-auto custom-scrollbar">
          {articles.map((article, index) => (
            <a key={index} href={article.url} target="_blank" rel="noopener noreferrer" className="block p-2.5 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-200">
              {settings?.showImages && article.urlToImage && (
                <img src={article.urlToImage} alt={article.title} className="w-full h-32 object-cover rounded-md mb-2" />
              )}
              <h3 className="font-semibold text-sm mb-1">{article.title}</h3>
              {settings?.showDescription && <p className="text-xs text-slate-400 mb-1">{article.description}</p>}
              <div className="text-xs text-slate-500 flex justify-between">
                <span>{article.source.name}</span>
                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Settings Panel ---

export const NewsSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: NewsWidgetSettings | undefined;
  onSave: (newSettings: NewsWidgetSettings) => void;
}> = ({ widgetId, currentSettings, onSave }) => {
  const [settings, setSettings] = useState<NewsWidgetSettings>(currentSettings || {});

  const handleSave = () => {
    onSave(settings);
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50";
  const labelClass = "block text-sm font-medium text-secondary mb-1 dark:text-slate-300";
  const checkboxLabelClass = "flex items-center text-sm font-medium text-secondary cursor-pointer dark:text-slate-300";
  const sectionTitleClass = "text-md font-semibold text-primary mt-4 mb-2 border-b border-border-interactive pb-1 dark:text-slate-100 dark:border-slate-700";

  return (
    <div className="space-y-4 text-primary dark:text-slate-50 max-h-[60vh] overflow-y-auto pr-2">
        <h3 className={sectionTitleClass}>Content</h3>
        <div>
            <label htmlFor={`${widgetId}-country`} className={labelClass}>Country</label>
            <select
              id={`${widgetId}-country`}
              value={settings.country || 'us'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, country: e.target.value })}
              className={inputClass}
            >
              {NEWS_COUNTRIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor={`${widgetId}-category`} className={labelClass}>Category</label>
            <select
              id={`${widgetId}-category`}
              value={settings.category || 'general'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSettings({ ...settings, category: e.target.value })}
              className={inputClass}
            >
              {NEWS_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor={`${widgetId}-keywords`} className={labelClass}>Keywords</label>
            <input
              id={`${widgetId}-keywords`}
              type="text"
              value={settings.keywords || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, keywords: e.target.value })}
              placeholder="e.g., Tesla, AI"
              className={inputClass}
            />
        </div>

        <h3 className={sectionTitleClass}>Display & Behavior</h3>
        <div>
            <label htmlFor={`${widgetId}-articlesToShow`} className={labelClass}>Articles to Show</label>
            <input
              id={`${widgetId}-articlesToShow`}
              type="number"
              value={settings.articlesToShow || 20}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, articlesToShow: parseInt(e.target.value, 10) })}
              min="1"
              max="100"
              className={inputClass}
            />
        </div>
        <div>
            <label htmlFor={`${widgetId}-updateInterval`} className={labelClass}>Update Interval (minutes)</label>
            <input
              id={`${widgetId}-updateInterval`}
              type="number"
              value={settings.updateInterval || DEFAULT_UPDATE_INTERVAL}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, updateInterval: parseInt(e.target.value, 10) })}
              min="1"
              className={inputClass}
            />
        </div>
        <div>
            <label className={labelClass}>Display Options</label>
            <div className="flex items-center space-x-4 mt-2">
              <label htmlFor={`${widgetId}-showImages`} className={checkboxLabelClass}>
                <input
                  id={`${widgetId}-showImages`}
                  type="checkbox"
                  checked={settings.showImages !== false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, showImages: e.target.checked })}
                  className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget dark:bg-slate-600"
                />
                <span>Show Images</span>
              </label>
              <label htmlFor={`${widgetId}-showDescription`} className={checkboxLabelClass}>
                <input
                  id={`${widgetId}-showDescription`}
                  type="checkbox"
                  checked={settings.showDescription !== false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, showDescription: e.target.checked })}
                  className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget dark:bg-slate-600"
                />
                <span>Show Description</span>
              </label>
            </div>
        </div>

      <button onClick={handleSave} className="mt-6 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface dark:bg-blue-600 dark:hover:bg-blue-500">
        Save News Settings
      </button>
    </div>
  );
};

export default NewsWidget;
