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
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query || query.trim() === '') {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(false); // Reset while typing
    
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Arama yapılıyor:", query);
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
        if (!response.ok) throw new Error('Arama başarısız oldu');
        
        const data = await response.json();
        console.log("Gelen veri:", data);
        
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
        console.error("Hata oluştu:", err);
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
        setResults([]);
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading, error, hasSearched };
}
