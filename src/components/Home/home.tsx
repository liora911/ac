"use client";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Image from "next/image";
import React, { useState } from "react";
import { FaFacebook, FaYoutube } from "react-icons/fa";

const Home = () => {
  const { t, locale, setLocale } = useTranslation();
  const [showBio, setShowBio] = useState(false);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 md:p-24 text-gray-800">
      <div className="text-center max-w-3xl w-full bg-white shadow-xl rounded-lg p-6 sm:p-8 md:p-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-700">
          {t("home.name")}
        </h1>
        <p className="text-lg sm:text-xl mt-2 text-gray-700">
          {t("home.tagline")}
        </p>

        <div className="my-6 sm:my-8">
          <Image
            src="/acpfp2.png"
            alt="Avshalom C. Elitzur"
            width={150}
            height={150}
            className="mx-auto rounded-full border-4 border-blue-300 shadow-md"
          />
          <p className="text-xs sm:text-sm mt-2 text-gray-500">
            {t("home.photoCredit")}
          </p>
        </div>

        <p className="text-md sm:text-lg mt-4">{t("home.greeting")}</p>

        <div className="mt-4 text-left text-sm sm:text-base space-y-3">
          <p>{t("home.intro")}</p>
          <p>{t("home.comments")}</p>
        </div>

        <p
          className="mt-3 text-right text-sm sm:text-base max-w-2xl mx-auto"
          dir="rtl"
        >
          {t("home.mainTopic")}
        </p>
        <div
          className="mt-4 text-sm sm:text-base text-right max-w-3xl mx-auto"
          dir="rtl"
        >
          {!showBio ? (
            <button
              onClick={() => setShowBio(true)}
              className="text-blue-600 hover:underline font-medium"
              style={{ cursor: "pointer" }}
            >
              {t("home.bio.buttonRead")}
            </button>
          ) : (
            <>
              <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                אבשלום אליצור (לסיפור-חיים "צהוב" ראו בויקיפדיה) הוא
                פרופסור-נלווה במכון למחקרים קוונטיים באוניברסיטת צ'פמאן
                בקליפורניה, בראשות פרופ' יקיר אהרונוב, לצד חתני פרס נובל פול
                אנגלרט ודייוויד גרוס. פרופסורים-נלווים אחרים הם סר מייקל ברי
                ופול דייויס. ​ תחומי התמחותו הם תורת הקוונטים, יחסות
                ותרמודינמיקה, וכן תרמודינמיקה של מערכות חיות. את הדוקטורט עשה
                בהדרכת פרופ' יקיר אהרונוב. בין תגליותיו נמנים ניסוי
                אליצור-ויידמן (1993), בשמו הידוע יותר "ניסוי הפצצה-שלא-התפוצצה,"
                שנדחה מכתבי-עת רבים עד שהוכח באינספור מעבדות ברחבי העולם;
                "פרדוקס השקרן הקוונטי" (אליצור-דולב, 2005, אהרונוב-
                כהן-אליצור-סמולין, 2017); ניסוי ה-EPR מנבא העתיד
                (אהרונוב-כהן-אליצור, 2014); וניסוי החלקיק הנעלם
                (אהרונוב-כהן-לנדאו-אליצור, 2017). את עבודותיו הציג במפגשים
                המדעיים היוקרתיים בעולם, כולל הרצאות מליאה והרצאות keynote לצד
                חתני-פרס נובל, בין השאר באוניברסיטאות קיימברידג' ופרינסטון,
                במכון שרדינגר בווינה וב-ETH בציריך. ארגן וישב-ראש בכינוסים
                מובילים. הוזמן להרצות בכל האוניברסיטאות ומוסדות המחקר הגדולים
                בארץ בסמינרים, הרצאות קולוקוויום, ובמות דיקאן ורקטור. פעמים
                אחדות הוזמן להרצות בישיבות סגורות של הסגל המדעי בקריה למחקר
                גרעיני בדימונה ובמכון הביולוגי בנס-ציונה. ​ שימש כמרצה, יועץ
                וחוקר בדרגות מרצה/חוקר בכיר, פרופסור-אורח ופרופסור-חבר במוסדות
                רבים בארץ ובעולם: מכון וייצמן למדע, אוניברסיטת תל-אביב,
                האוניברסיטה העברית, אוניברסיטת בר-אילן, הטכניון, מכון בירלה למדע
                וטכנולוגיה במומבאי, אוניברסיטת ז'וזף פורייה ("קתדרת מצוינות")
                בגרנובל, צרפת, ומכון פרימטר לפיזיקה עיונית בווטרלו, קנדה (ראו CV
                באתר זה). ​ היה יו"ר החברה הישראלית לחקר ראשית החיים
                ואסטרוביולוגיה ILASOL שנוסדה ב-1976 ומארחת מדענים מישראל ומחו"ל.
                חבר במערכות כתבי-עת, אגודות מדעיות והוצאות ספרים מדעיות בעולם.
                ​​ לצד תחום התמחותו העיקרי פרסם גם מאמרים רבים במדעי החיים
                וההתנהגות. המאמר "מה תאמר לאדם שעל הגג" שכתב יחד עם פרופ' חיים
                עומר, שבמקורו נועד לאנשי מקצוע העוסקים במניעת התאבדויות, נפוץ
                כיום ברשת בכמה שפות, כולל ערבית. את עבודותיו הוזמן להציג בפגישות
                החברה הישראלית לפסיכיאטריה, בפגישות-סגל בבתי-החולים והמרכזים
                לבריאות-הנפש "שלוותה," "אברבנאל," "איתנים," "קפלן," "איכילוב,"
                באר-יעקב, נס-ציונה, שער מנשה ובאר-שבע, וצוותי רע"נ בריאות-הנפש
                ורמ"ח נפגעים בצה"ל. כן העביר הרצאות וסדנאות ישירות לנפגעי טראומה
                ב"סדנת גל" בתל-השומר, לנגמלים מסמים בתחנת השיקום של עיריית
                תל-אביב, ולאסירי אגף נ"ס (נקי מסמים) בכלא רמלה. לימד קורס ייחודי
                בתוכנית למטפלים מיניים במחלקה לעבודה סוציאלית באוניברסיטת
                בר-אילן בשנותיה הראשונות. ​ מרצה-אורח בתוכניות ללימודי המשך
                בפקולטה לרפואה ע"ש סאקלר, אוניברסיטת תל-אביב. כל מאמריו ומצגותיו
                בעברית ובאנגלית זמינים באתרו תחת ההיתר הגורף "copyleft." נמנה עם
                מקימי המכון המתהווה אִייָר, מכון ישראלי למחקר מתקדם במדעי הטבע
                בראשות פרופ' יקיר אהרונוב. ​ פעילות ציבורית: שימש יו"ר אגודת
                "מכנף דרום לציון" למען שארית יהדות אתיופיה והשתתף במאבק להעלאתם,
                לצד ח"כ ד"ר אברהם נגוסה, פרופ' מיכאל קורינלדי והרב מנחם ולדמן.
                פעיל במאבק הציבורי לביעור השחיתות יחד עם מני נפתלי, בעבר אב-הבית
                בבית ראש הממשלה, וחושפי השחיתות רפי רותם ושוקי משעול. הרצה
                בהתנדבות באגף "נס" בכלא ניצן, בתחנה לנגמלים של עיריית תל-אביב,
                באגודה למלחמה בסרטן, בארגון נפגעי טרור ומסגרות התנדבותיות רבות.
                שותף בפעולות שלום והתנגדות לאפליה וגזענות. לימד בהתנדבות
                כפרופסור-אורח לפיזיקה במכון איימס AIMS למתמטיקה בקיגאלי, רואנדה.
              </p>

              <button
                onClick={() => setShowBio(false)}
                className="text-blue-600 hover:underline font-medium mt-3 block"
                style={{ cursor: "pointer" }}
              >
                {t("home.bio.buttonHide")}
              </button>
            </>
          )}
        </div>

        <div className="mt-6 sm:mt-8 border-t pt-6 sm:pt-8">
          <div className="flex justify-center space-x-6">
            <a
              href="https://www.facebook.com/avshalom.elitzur"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-2xl transition-transform duration-200 transform hover:scale-110"
              aria-label="Facebook"
            >
              <FaFacebook />
            </a>
            <a
              href="https://www.youtube.com/@avshalomelitzur424"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-800 text-2xl transition-transform duration-200 transform hover:scale-110"
              aria-label="YouTube"
            >
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
