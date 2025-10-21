"use client";

import React from "react";
import EditArticleForm from "@/components/EditArticle/edit_article";
import { useTranslation } from "@/contexts/Translation/translation.context";

export default function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [articleId, setArticleId] = React.useState<string>("");
  const { t, locale } = useTranslation();

  React.useEffect(() => {
    params.then((p) => setArticleId(p.id));
  }, [params]);

  return (
    <div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          {t("editArticlePage.title")}
        </h1>
        {articleId && <EditArticleForm articleId={articleId} />}
      </div>
    </div>
  );
}
