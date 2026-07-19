import { useState, useEffect } from 'react';

export interface BookSearchResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
    };
  };
}

export function useGoogleBooks(query: string) {
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.trim() === '') {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        // We use Open Library API because Google Books API without a key often hits 429 Quota Exceeded limits.
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`);
        if (!response.ok) throw new Error('Arama başarısız oldu');
        
        const data = await response.json();
        
        const formattedResults = (data.docs || []).map((doc: any) => ({
          id: doc.key,
          volumeInfo: {
            title: doc.title,
            authors: doc.author_name || [],
            pageCount: doc.number_of_pages_median,
            description: doc.first_publish_year ? `İlk basım yılı: ${doc.first_publish_year}` : undefined,
            imageLinks: doc.cover_i ? {
              thumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            } : undefined
          }
        }));
        
        setResults(formattedResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading, error };
}
