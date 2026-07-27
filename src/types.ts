export type BookStatus = 'reading' | 'completed' | 'want-to-read';

export interface Book {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  isFavorite: boolean;
  coverColor?: string; // We'll keep this as fallback if no image is found
  coverImageUrl?: string;
  isbn?: string;
  pageCount?: number;
  readPages?: number; // For the progress bar of currently reading books
  description?: string;
  category?: string;
  addedAt?: number;
  startDate?: number;
  endDate?: number;
  rating?: number; // 1-10
  emotion?: string; // Emotion tag (e.g., "Sarsıcı", "İlham Verici")
  quantity?: number; // Aynı kitaptan kaç adet olduğunu tutmak için
}

export interface Note {
  id: string;
  content: string;
  isFavoriteQuote: boolean;
  createdAt: number;
  bookId?: string; // Optional for backward compatibility, but required for new notes
  pageNumber?: number;
}

export interface ReadingStat {
  month: string;
  pagesRead: number;
}

export interface UserProfile {
  name: string;
  avatarUrl?: string;
  yearlyGoal: number;
  joinDate: number;
}

export interface Shelf {
  id: string;
  name: string;
  color: string;
  bookIds: string[];
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  date: string; // YYYY-MM-DD format
  type: 'read' | 'note' | 'focus';
  count: number;
}
