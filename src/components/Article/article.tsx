"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

const mockArticles = [
  {
    id: "1",
    publisherImage: "/NNZxjUl0_400x400.png",
    publisherName: "פרופ' אבשלום אליצור",
    date: "4.6.2025",
    readDuration: 10,
    title: "כיצד המוח מודד את עצמו ומהי נוירוכימיה",
    articleImage: "/consc.png",
    content: `זוהי פסקה ראשונה של המאמר. היא דנה ברעיונות מורכבים בצורה נגישה. 
    הפיזיקה הקוונטית פותחת בפנינו צוהר להבנת המציאות בדרכים חדשות ומפתיעות.
    במאמר זה, נחקור את הקשר בין תופעות קוונטיות לבין חווית התודעה האנושית,
    ונבחן האם ניתן למצוא הסברים מדעיים לתחושות וחוויות שנחשבו עד כה מעבר להישג ידה של הפיזיקה.`,
  },
  {
    id: "2",
    publisherImage: "/richardfeynman.png",
    publisherName: 'ד"ר מישהו כהן',
    date: "4.6.2025",
    readDuration: 8,
    title: "בינה מלאכותית והטבע",
    articleImage: "/qftt.png",
    content: `ההתקדמות המהירה בתחום הבינה המלאכותית מעלה שאלות רבות לגבי עתידנו.
    האם מכונות יוכלו יום אחד לחשוב, להרגיש וליצור כמו בני אדם?
    מהן ההשלכות האתיות של פיתוחים אלו?`,
  },
  {
    id: "3",
    publisherImage: "/NNZxjUl0_400x400.png",
    publisherName: "פרופ' אבשלום אליצור",
    date: "4.6.2025",
    readDuration: 12,
    title: "הפיזיקאי והחוליגן",
    articleImage: "/tester.webp",
    content: `זה סיפור על סדרת מפגשים בין פיזיקאי וכוכב כדורגל.
  
  הפיזיקאי עוסק הרבה שנים בתורת הקוונטים וזכה לכמה הישגים. הוא לימד בכמה אוניברסיטאות פיזיקה, חקר המוח, פסיכולוגיה ופילוסופיה, ופרסם הרבה מאמרים בתחומים האלה. כדורגל? מבחינתו זה היה מה שאמר פעם מורו פרופ’ ישעיהו ליבוביץ ז”ל: “עשרים ושניים חוליגנים רצים אחרי כדור.”
  
  הכדורגלן אהב כדורגל מילדותו במעלות, ספורט שלמד מאביו, ומתחילת הקריירה כבש כמה שערים שעלו לכותרות. אחרי פציעה נאלץ לפרוש בצער, אבל הוציא מהלימון הזה לימונדה: הוא נעשה מאמן מנטאלי. אנשים מכל העולם לומדים ממנו כיום איך לשחק במגרש של החיים, בין קללות הצופים לבין הכרטיס הצהוב של השופט (רמז: ממש לא להיות חוליגנים). תורת הקוונטים? בשבילו היא הייתה קסם שרצה להבין.
  
  אז כשהלך אל הפיזיקאי וביקש ללמוד עליה, הרגיש המרצה הסנוב שהוא נמס מהבקשה, והתאפק ולא קרא לו חוליגן. ישבו ודיברו ואכלו ושתו והמשיכו לדבר. וככל שניסה הפיזיקאי להסביר לחברו החדש על ענייני מדע ורוח, מצא את עצמו מתאמץ לעשות את זה יותר ויותר מדויק, ויחד עם זה הכי יפה וקל להבנה. פה ושם אפילו השתמש בכדורגלן להדגים עליו רפלקסים ועוד דברים שקשורים לפיזיקה ולמוח ונפש. שמח הכדורגלן והוסיף תובנות מהצד שלו, הספורט והאימון המנטלי. הקשיב הפיזיקאי וחשב, הבין שגם הוא בעצמו קצת חוליגן ושהתובנות האלה עוזרות גם לו. ככה דיברו ודיברו עד שבסוף עשו יחד ילד. האמת יצא להם שלישייה: שלוש סדרות וידאו אונליין של מפגשים בין מדע ואימון מנטאלי:
  
  א. קוונטי אלגנטי: מבוא לתורת הקוונטים, בשפה פשוטה אבל עדכנית ומדויקת, עם מצגת ידידותית. החל מהפיזיקה הקלאסית, עקרונות-היסוד של עולם הקוונטים, הפרדוקסים והניסויים המפליאים, עד ההשלכות של התורה לטכנולוגיה ולחיינו ביומיום.
  
  ב. מהנוירון עד הרעיון: מבוא להכרת המוח, מבנהו ופעולתו, והגשרים בין חקר המוח לפסיכולוגיה המודרנית, עם תמונות וצילומים באיכות מעולה. מה קורה לנו בראש כשאנחנו חושבים, מרגישים וזוכרים? מה ידוע, מה התגלה לאחרונה, ומה עדיין חידה?
  
  ג. מההפתעה עד ההבקעה: מה מלמדת תורת הקוונטים על נפש האדם ועל חידת התודעה? מה יודע מחקר המוח על הגאונות? האם צורת חשיבה קוונטית יכול להזמין הברקות יצירתיות? איך ליישם את כל אלה לחיים?`,
  },
];

export default function ArticlePage() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get("id");

  const [article, setArticle] = useState<any>(null);

  useEffect(() => {
    const found = mockArticles.find((a) => a.id === articleId);
    setArticle(found);
  }, [articleId]);

  if (!article) {
    return (
      <div className="p-8 text-center text-gray-600 rtl">המאמר לא נמצא.</div>
    );
  }

  return (
    <div className="w-full bg-white text-gray-900">
      <div className="relative w-full h-[80vh]">
        <Image
          src={article.articleImage}
          alt={article.title}
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-center items-start px-8 sm:px-16 md:px-24 text-white rtl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight max-w-5xl drop-shadow-md">
            {article.title}
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-200 font-light">
            מאת {article.publisherName} · {article.date}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-12 py-12 rtl">
        <div className="flex items-center gap-4 mb-6">
          {article.publisherImage && (
            <Image
              src={article.publisherImage}
              alt={article.publisherName}
              width={40}
              height={40}
              className="rounded-full border"
            />
          )}
          <div>
            <p className="font-semibold">{article.publisherName}</p>
            <p className="text-sm text-gray-600">
              {article.date} · {article.readDuration} דקות קריאה
            </p>
          </div>
        </div>

        <div className="text-lg leading-loose text-gray-800 whitespace-pre-line">
          {article.content}
        </div>
      </div>
    </div>
  );
}
