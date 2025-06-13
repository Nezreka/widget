// src/hooks/useNewsFeed.ts
import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, NewsWidgetSettings } from '../components/NewsWidget'; // Adjust path as needed

const DEFAULT_UPDATE_INTERVAL = 15; // 15 minutes

interface UseNewsFeedResult {
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
  refetchNews: () => void;
}

export const useNewsFeed = (settings: NewsWidgetSettings | undefined): UseNewsFeedResult => {
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

  return { articles, loading, error, refetchNews: fetchNews };
};
