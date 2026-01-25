export interface VercelAnalyticsResponse {
  data?: {
    pageViews?: number;
    visitors?: number;
    uniqueVisitors?: number;
  };
  series?: Array<{
    key: string;
    total: number;
  }>;
}
