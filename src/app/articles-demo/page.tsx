// import ArticlesGrid from "@/components/Articles/Articles";

// export default function ArticlesDemoPage() {
//   const articlesData = [
//     {
//       id: "1",
//       publisherImage: "/NNZxjUl0_400x400.png",
//       publisherName: "פרופ' אבשלום אליצור",
//       date: "4.6.2025",
//       readDuration: 10,
//       title: "כיצד המוח מודד את עצמו ומהי נוירוכימיה",
//       articleImage: "/consc.png",
//       content:
//         "זוהי פסקה ראשונה של המאמר. היא דנה ברעיונות מורכבים בצורה נגישה. " +
//         "הפיזיקה הקוונטית פותחת בפנינו צוהר להבנת המציאות בדרכים חדשות ומפתיעות. " +
//         "במאמר זה, נחקור את הקשר בין תופעות קוונטיות לבין חווית התודעה האנושית, " +
//         "ונבחן האם ניתן למצוא הסברים מדעיים לתחושות וחוויות שנחשבו עד כה מעבר להישג ידה של הפיזיקה.",
//     },
//     {
//       id: "2",
//       publisherImage: "/richardfeynman.png",
//       publisherName: 'ד"ר מישהו כהן',
//       date: "4.6.2025",
//       readDuration: 8,
//       title: "בינה מלאכותית והטבע",
//       articleImage: "/qftt.png",
//       content:
//         "ההתקדמות המהירה בתחום הבינה המלאכותית מעלה שאלות רבות לגבי עתידנו. " +
//         "האם מכונות יוכלו יום אחד לחשוב, להרגיש וליצור כמו בני אדם? " +
//         "מהן ההשלכות האתיות של פיתוחים אלו? מאמר זה סוקר את ההתפתחויות האחרונות " +
//         "ומציע נקודות מבט שונות על האתגרים וההזדמנויות העומדים בפנינו.",
//     },
//     {
//       id: "3",
//       publisherImage: "/NNZxjUl0_400x400.png",
//       publisherName: "פרופ' אבשלום אליצור",
//       date: "4.6.2025",
//       readDuration: 12,
//       title: "הפיזיקאי והחוליגן",
//       articleImage: "/tester.webp",
//       content: `זה סיפור על סדרת מפגשים בין פיזיקאי וכוכב כדורגל.

//     הפיזיקאי עוסק הרבה שנים בתורת הקוונטים וזכה לכמה הישגים. הוא לימד בכמה אוניברסיטאות פיזיקה, חקר המוח, פסיכולוגיה ופילוסופיה, ופרסם הרבה מאמרים בתחומים האלה. כדורגל? מבחינתו זה היה מה שאמר פעם מורו פרופ’ ישעיהו ליבוביץ ז”ל: “עשרים ושניים חוליגנים רצים אחרי כדור.”

//     הכדורגלן אהב כדורגל מילדותו במעלות, ספורט שלמד מאביו, ומתחילת הקריירה כבש כמה שערים שעלו לכותרות. אחרי פציעה נאלץ לפרוש בצער, אבל הוציא מהלימון הזה לימונדה: הוא נעשה מאמן מנטאלי. אנשים מכל העולם לומדים ממנו כיום איך לשחק במגרש של החיים, בין קללות הצופים לבין הכרטיס הצהוב של השופט (רמז: ממש לא להיות חוליגנים). תורת הקוונטים? בשבילו היא הייתה קסם שרצה להבין.

//     אז כשהלך אל הפיזיקאי וביקש ללמוד עליה, הרגיש המרצה הסנוב שהוא נמס מהבקשה, והתאפק ולא קרא לו חוליגן. ישבו ודיברו ואכלו ושתו והמשיכו לדבר. וככל שניסה הפיזיקאי להסביר לחברו החדש על ענייני מדע ורוח, מצא את עצמו מתאמץ לעשות את זה יותר ויותר מדויק, ויחד עם זה הכי יפה וקל להבנה. פה ושם אפילו השתמש בכדורגלן להדגים עליו רפלקסים ועוד דברים שקשורים לפיזיקה ולמוח ונפש. שמח הכדורגלן והוסיף תובנות מהצד שלו, הספורט והאימון המנטלי. הקשיב הפיזיקאי וחשב, הבין שגם הוא בעצמו קצת חוליגן ושהתובנות האלה עוזרות גם לו. ככה דיברו ודיברו עד שבסוף עשו יחד ילד. האמת יצא להם שלישייה: שלוש סדרות וידאו אונליין של מפגשים בין מדע ואימון מנטאלי:

//     א. קוונטי אלגנטי: מבוא לתורת הקוונטים, בשפה פשוטה אבל עדכנית ומדויקת, עם מצגת ידידותית. החל מהפיזיקה הקלאסית, עקרונות-היסוד של עולם הקוונטים, הפרדוקסים והניסויים המפליאים, עד ההשלכות של התורה לטכנולוגיה ולחיינו ביומיום.

//     ב. מהנוירון עד הרעיון: מבוא להכרת המוח, מבנהו ופעולתו, והגשרים בין חקר המוח לפסיכולוגיה המודרנית, עם תמונות וצילומים באיכות מעולה. מה קורה לנו בראש כשאנחנו חושבים, מרגישים וזוכרים? מה ידוע, מה התגלה לאחרונה, ומה עדיין חידה?

//     ג. מההפתעה עד ההבקעה: מה מלמדת תורת הקוונטים על נפש האדם ועל חידת התודעה? מה יודע מחקר המוח על הגאונות? האם צורת חשיבה קוונטית יכול להזמין הברקות יצירתיות? איך ליישם את כל אלה לחיים?`,
//     },
//   ];

//   return (
//     <div className="p-4">
//       <h1 className="text-center text-2xl font-bold mb-6">מאמרים</h1>
//       <ArticlesGrid articles={articlesData} />
//     </div>
//   );
// }
// Update your ArticlesDemoPage to include the create form:
"use client";

import { useEffect, useState } from "react";
import ArticlesGrid from "@/components/Articles/Articles";
import CreateArticleForm from "@/components/CreateArticle/create_article";
import { ArticleProps } from "@/types/Articles/articles";

export default function ArticlesDemoPage() {
  const [articles, setArticles] = useState<ArticleProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/articles");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setArticles(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleArticleCreated = () => {
    // Refresh the articles list after creating a new one
    fetchArticles();
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען מאמרים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchArticles()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold rtl">מאמרים</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors rtl"
        >
          {showCreateForm ? "ביטול" : "+ מאמר חדש"}
        </button>
      </div>

      {/* Create Form (shown/hidden based on state) */}
      {showCreateForm && (
        <div className="mb-8">
          <CreateArticleForm onSuccess={handleArticleCreated} />
        </div>
      )}

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 text-lg rtl">אין מאמרים זמינים כרגע</p>
            <p className="text-sm text-gray-500 mt-2 rtl">
              צור מאמר חדש או הרץ: node scripts/seed.js
            </p>
          </div>
        </div>
      ) : (
        <ArticlesGrid articles={articles} />
      )}
    </div>
  );
}
