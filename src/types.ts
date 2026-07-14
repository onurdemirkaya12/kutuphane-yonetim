export type BookStatus = 'reading' | 'completed' | 'want-to-read';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  isFavorite: boolean;
  coverColor: string;
}

export interface Note {
  id: string;
  content: string;
  isFavoriteQuote: boolean;
  createdAt: number;
}

export interface ReadingStat {
  month: string;
  pagesRead: number;
}
