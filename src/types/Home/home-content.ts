export type HomeContent = {
  id: string;
  heroHtml: string | null;
  heroHtmlLeft: string | null;
  heroHtmlRight: string | null;
  imageUrl: string | null;
  photoCredit: string | null;
  bioHtml: string;
  updatedAt: string | null;
};

export type UpdateHomeContentPayload = {
  heroHtml?: string | null;
  heroHtmlLeft?: string | null;
  heroHtmlRight?: string | null;
  imageUrl?: string | null;
  photoCredit?: string | null;
  bioHtml?: string;
};
