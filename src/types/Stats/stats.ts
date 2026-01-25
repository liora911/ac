/**
 * Statistics and metrics types
 */

export interface StatItem {
  total: number;
  thisMonth: number;
}

export interface Stats {
  articles: StatItem;
  events: StatItem;
  lectures: StatItem;
  presentations: StatItem;
}
