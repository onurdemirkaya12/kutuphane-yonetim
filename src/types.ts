export type BookStatus = 'reading' | 'completed' | 'want-to-read';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  isFavorite: boolean;
  coverColor?: string; // We'll keep this as fallback if no image is found
  coverImageUrl?: string;
  pageCount?: number;
  readPages?: number; // For the progress bar of currently reading books
  description?: string;
  addedAt?: number;
}

export interface Note {
  id: string;
  content: string;
  isFavoriteQuote: boolean;
  createdAt: number;
  bookId?: string; // Optional for backward compatibility, but required for new notes
}

export interface ReadingStat {
  month: string;
  pagesRead: number;
}
