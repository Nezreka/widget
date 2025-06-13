"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNewsFeed } from '../hooks/useNewsFeed';
import ArticleCard from './news/ArticleCard';
import ArticleSkeleton from './news/ArticleSkeleton';
import CategoryTabs from './news/CategoryTabs';
import ArticleViewer from './news/ArticleViewer';

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

const NEWS_CATEGORIES = ['general', 'business', 'entertainment', 'health', 'science', 'sports', 'technology'];
const NEWS_COUNTRIES = ['us', 'gb', 'ca', 'au', 'de', 'fr', 'in', 'jp'];

// --- Main Component ---

const NewsWidget: React.FC<NewsWidgetProps> = ({ settings }) => {
  const [selectedCategory, setSelectedCategory] = useState(settings?.category || 'general');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const memoizedSettings = useMemo(() => ({
    ...settings,
    category: selectedCategory
  }), [settings, selectedCategory]);

  const { articles, loading, error } = useNewsFeed(memoizedSettings);

  useEffect(() => {
    if (settings?.category && settings.category !== selectedCategory) {
      setSelectedCategory(settings.category);
    }
  }, [settings?.category]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const otherArticles = articles.slice(1);

  const handleArticleSelect = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  const handleCloseViewer = () => {
    setSelectedArticle(null);
  };

  return (
    <div className="@container/news w-full h-full flex flex-col bg-dark-surface/50 text-primary overflow-hidden p-4 space-y-4">
      {selectedArticle && (
        <ArticleViewer article={selectedArticle} onClose={handleCloseViewer} />
      )}
      <CategoryTabs
        categories={NEWS_CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar">
        {loading && (
          <div className="space-y-6">
            <ArticleSkeleton isFeatured />
            <div className="grid grid-cols-1 @md/news:grid-cols-2 @2xl/news:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => <ArticleSkeleton key={i} />)}
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full text-red-400 text-center p-4">
            <p className="font-semibold">Error fetching news</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            {articles.length > 0 ? (
              <motion.div
                key={selectedCategory} // This key is crucial for re-triggering animation on category change
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Featured Article */}
                {featuredArticle && (
                  <motion.div layout variants={containerVariants}>
                    <ArticleCard
                      article={featuredArticle}
                      isFeatured
                      showImages={settings?.showImages !== false}
                      showDescription={settings?.showDescription !== false}
                      onArticleSelect={() => handleArticleSelect(featuredArticle)}
                    />
                  </motion.div>
                )}

                {/* Other Articles Grid */}
                {otherArticles.length > 0 && (
                  <motion.div
                    className="grid grid-cols-1 @md/news:grid-cols-2 @2xl/news:grid-cols-3 gap-4"
                    variants={containerVariants}
                  >
                    {otherArticles.map((article, index) => (
                      <ArticleCard
                        key={article.url + index}
                        article={article}
                        showImages={settings?.showImages !== false}
                        showDescription={settings?.showDescription !== false}
                        onArticleSelect={() => handleArticleSelect(article)}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="no-articles"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-center h-full text-slate-400 text-center p-4"
              >
                {`No articles found for '${selectedCategory}'.`}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// --- Settings Panel ---

export const NewsSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: NewsWidgetSettings | undefined;
  onSave: (newSettings: NewsWidgetSettings) => void;
}> = ({ widgetId, currentSettings, onSave }) => {
  const [settings, setSettings] = React.useState<NewsWidgetSettings>(currentSettings || {});

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
              value={settings.updateInterval || 10} // Default interval is 10 minutes
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
