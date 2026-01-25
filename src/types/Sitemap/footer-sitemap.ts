export interface ArticlePreview {
  id: string;
  title: string;
  slug: string;
}

export interface CategoryWithArticles {
  id: string;
  name: string;
  articles: ArticlePreview[];
}

export interface FooterSitemapData {
  categories: CategoryWithArticles[];
}
