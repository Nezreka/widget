// /app/api/news/route.ts
import { NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
const TOP_HEADLINES_URL = 'https://newsapi.org/v2/top-headlines';
const EVERYTHING_URL = 'https://newsapi.org/v2/everything';

export async function GET(request: Request) {
  if (!NEWS_API_KEY) {
    console.error('News API key is missing.');
    return NextResponse.json({ error: 'News API key is not configured.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'us';
  const category = searchParams.get('category') || 'general';
  const q = searchParams.get('q') || '';
  const pageSize = searchParams.get('pageSize') || '20';

  const useEverythingEndpoint = !!q;
  const url = new URL(useEverythingEndpoint ? EVERYTHING_URL : TOP_HEADLINES_URL);
  url.searchParams.append('apiKey', NEWS_API_KEY);
  url.searchParams.append('pageSize', pageSize);

  if (useEverythingEndpoint) {
    url.searchParams.append('q', q);
    url.searchParams.append('sortBy', 'relevancy'); 
  } else {
    url.searchParams.append('country', country);
    if (category) {
      url.searchParams.append('category', category);
    }
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json();
      console.error('News API response error:', errorData);
      return NextResponse.json({ error: `News API error: ${errorData.message || 'Unknown error'}` }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch news data:', error);
    return NextResponse.json({ error: 'Failed to fetch news data.' }, { status: 500 });
  }
}
