export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  content?: string;
  eventDate?: string;
  date?: string;
  location?: string;
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SearchResults {
  articles: SearchResult[];
  presentations: SearchResult[];
  events: SearchResult[];
  lectures: SearchResult[];
  total: number;
  query: string;
}
