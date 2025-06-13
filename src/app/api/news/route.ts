// /app/api/news/route.ts
import { NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';

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

  const url = new URL(NEWS_API_URL);
  url.searchParams.append('apiKey', NEWS_API_KEY);
  url.searchParams.append('country', country);
  url.searchParams.append('pageSize', pageSize);
  if (category) {
    url.searchParams.append('category', category);
  }
  if (q) {
    url.searchParams.append('q', q);
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
