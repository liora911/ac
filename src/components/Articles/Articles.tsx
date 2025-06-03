import React from "react";
import Image from "next/image";
import { ArticleProps } from "@/types/Articles/articles";

const Articles: React.FC<ArticleProps> = ({
  publisherImage,
  publisherName,
  date,
  readDuration,
  title,
  articleImage,
  content,
}) => {
  return (
    <article
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "30px",
        fontFamily: "Arial, sans-serif",
        direction: "rtl",
      }}
    >
      <header
        style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}
      >
        {publisherImage && (
          <Image
            src={publisherImage}
            alt={`${publisherName} profile`}
            width={40}
            height={40}
            style={{ borderRadius: "50%", marginRight: "10px" }}
          />
        )}
        <div>
          <p style={{ margin: 0, fontWeight: "bold" }}>{publisherName}</p>
          <p style={{ margin: 0, fontSize: "0.9em", color: "#555" }}>
            {date} · {readDuration} דקות קריאה
          </p>
        </div>
      </header>
      <h2 style={{ fontSize: "1.8em", marginBottom: "10px" }}>{title}</h2>
      {articleImage && (
        <div style={{ marginBottom: "15px" }}>
          <Image
            src={articleImage}
            alt={title}
            width={600}
            height={300}
            style={{
              borderRadius: "4px",
              objectFit: "cover",
              width: "100%",
              maxHeight: "300px",
            }}
          />
        </div>
      )}
      <div style={{ fontSize: "1.1em", lineHeight: "1.6" }}>
        <p>{content}</p>
      </div>
    </article>
  );
};

export default Articles;
