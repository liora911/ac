import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const articleId = params.id;

  if (articleId) {
    // Redirect old /article?id=xxx to new /articles/xxx
    redirect(`/articles/${articleId}`);
  }

  // If no ID, redirect to articles list
  redirect("/articles");
}
