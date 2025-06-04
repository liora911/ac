"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArticleProps } from "@/types/Articles/articles";

interface ArticleListProps {
  articles: ArticleProps[];
}

const ArticlesGrid: React.FC<ArticleListProps> = ({ articles }) => {
  console.log("runs");
  const router = useRouter();

  const handleClick = (id: string) => {
    router.push(`/article?id=${id}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 sm:p-6">
      {articles.map((article) => (
        <article
          key={article.id}
          onClick={() => handleClick(article.id)}
          className="bg-white border border-gray-300 rounded-lg p-5 cursor-pointer hover:shadow-lg transition duration-200 font-sans text-right"
        >
          <header className="flex items-center mb-4">
            {article.publisherImage && (
              <Image
                src={article.publisherImage}
                alt={`${article.publisherName} profile`}
                width={40}
                height={40}
                className="rounded-full ml-3"
              />
            )}
            <div>
              <p className="m-0 font-bold">{article.publisherName}</p>
              <p className="m-0 text-sm text-gray-600">
                {article.date} · {article.readDuration} דקות קריאה
              </p>
            </div>
          </header>

          <h2 className="text-xl font-semibold mb-3">{article.title}</h2>

          {article.articleImage && (
            <div className="mb-4">
              <Image
                src={article.articleImage}
                alt={article.title}
                width={600}
                height={300}
                className="rounded w-full max-h-[200px] object-cover"
              />
            </div>
          )}

          <p className="text-sm leading-relaxed text-gray-700 line-clamp-4">
            {article.content}
          </p>
        </article>
      ))}
    </div>
  );
};

export default ArticlesGrid;
