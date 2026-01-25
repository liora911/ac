import { ContentCardProps, ContentItem } from "@/types/Home/home";

export interface ExtendedContentCardProps extends ContentCardProps {
  contentType?: string;
  onLoadMore?: (type: string, skip: number) => Promise<{ items: ContentItem[]; hasMore: boolean }>;
}
