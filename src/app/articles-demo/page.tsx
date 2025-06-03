import React from "react";
import Articles from "@/components/Articles/Articles";

const ArticlesDemoPage = () => {
  const articlesData = [
    {
      id: "1",
      publisherImage: "/NNZxjUl0_400x400.png",
      publisherName: "פרופ' אבשלום אליצור",
      date: "25 במאי 2025",
      readDuration: 10,
      title: "כיצד המוח מודד את עצמו ומהי נוירוכימיה",
      articleImage: "/consc.png",
      content:
        "זוהי פסקה ראשונה של המאמר. היא דנה ברעיונות מורכבים בצורה נגישה. " +
        "הפיזיקה הקוונטית פותחת בפנינו צוהר להבנת המציאות בדרכים חדשות ומפתיעות. " +
        "במאמר זה, נחקור את הקשר בין תופעות קוונטיות לבין חווית התודעה האנושית, " +
        "ונבחן האם ניתן למצוא הסברים מדעיים לתחושות וחוויות שנחשבו עד כה מעבר להישג ידה של הפיזיקה.",
    },
    {
      id: "2",
      publisherImage: "/richardfeynman.png",
      publisherName: 'ד"ר אליס כהן',
      date: "26 במאי 2025",
      readDuration: 8,
      title: "בינה מלאכותית והטבע",
      articleImage: "/qftt.png",
      content:
        "ההתקדמות המהירה בתחום הבינה המלאכותית מעלה שאלות רבות לגבי עתידנו. " +
        "האם מכונות יוכלו יום אחד לחשוב, להרגיש וליצור כמו בני אדם? " +
        "מהן ההשלכות האתיות של פיתוחים אלו? מאמר זה סוקר את ההתפתחויות האחרונות " +
        "ומציע נקודות מבט שונות על האתגרים וההזדמנויות העומדים בפנינו.",
    },
    {
      id: "3",
      publisherImage: "/NNZxjUl0_400x400.png",
      publisherName: "פרופ אבשלום אליצור",
      date: "25 יוני 2023",
      readDuration: 5,
      title: "רמייה בביצה",
      articleImage: "/remia.png",
      content:
        "ההתקדמות המהירה בתחום הבינה המלאכותית מעלה שאלות רבות לגבי עתידנו. " +
        "האם מכונות יוכלו יום אחד לחשוב, להרגיש וליצור כמו בני אדם? " +
        "מהן ההשלכות האתיות של פיתוחים אלו? מאמר זה סוקר את ההתפתחויות האחרונות " +
        "ומציע נקודות מבט שונות על האתגרים וההזדמנויות העומדים בפנינו.",
    },
  ];

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        direction: "rtl",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "40px" }}>
        דף הדגמה למאמרים
      </h1>
      {articlesData.map((article) => (
        <Articles key={article.id} {...article} />
      ))}
    </div>
  );
};

export default ArticlesDemoPage;
