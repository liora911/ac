"use client";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Image from "next/image";
import React, { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const FaFacebook = dynamic(
  () => import("react-icons/fa").then((mod) => ({ default: mod.FaFacebook })),
  {
    loading: () => (
      <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
    ),
  }
);
const FaYoutube = dynamic(
  () => import("react-icons/fa").then((mod) => ({ default: mod.FaYoutube })),
  {
    loading: () => (
      <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
    ),
  }
);

const Home = () => {
  const { t } = useTranslation();
  const [showBio, setShowBio] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 md:p-24 text-[var(--foreground)]">
      <motion.div
        className="text-center max-w-3xl w-full bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--card)]/80 shadow-2xl rounded-xl p-6 sm:p-8 md:p-10 border border-[var(--border)]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          variants={itemVariants}
        >
          {t("home.name")}
        </motion.h1>
        <motion.p
          className="text-lg sm:text-xl mt-2 text-[var(--muted-foreground)]"
          variants={itemVariants}
        >
          {t("home.tagline")}
        </motion.p>

        <motion.div
          className="my-6 sm:my-8"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
          >
            <Image
              src="/acpfp2.png"
              alt="Avshalom C. Elitzur"
              width={150}
              height={150}
              className="mx-auto rounded-full border-4 border-gradient-to-r from-blue-400 via-purple-400 to-pink-400 shadow-xl ring-4 ring-white/60 hover:ring-6 hover:ring-white/80 transition-all duration-300"
              priority
              sizes="(max-width: 768px) 150px, 150px"
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
            />
          </motion.div>
          <motion.p
            className="text-xs sm:text-sm mt-2 text-[var(--muted-foreground)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            {t("home.photoCredit")}
          </motion.p>
        </motion.div>

        <motion.p
          className="text-md sm:text-lg mt-4 text-[var(--foreground)]"
          variants={itemVariants}
        >
          {t("home.greeting")}
        </motion.p>

        <motion.div
          className="mt-4 text-left text-sm sm:text-base space-y-3 text-[var(--foreground)]"
          variants={itemVariants}
        >
          <p>{t("home.intro")}</p>
          <p>{t("home.comments")}</p>
        </motion.div>

        <motion.p
          className="mt-3 text-right text-sm sm:text-base max-w-2xl mx-auto text-[var(--foreground)]"
          dir="rtl"
          variants={itemVariants}
        >
          {t("home.mainTopic")}
        </motion.p>
        <motion.div
          className="mt-4 text-sm sm:text-base text-right max-w-3xl mx-auto text-[var(--foreground)]"
          dir="rtl"
          variants={itemVariants}
        >
          {!showBio ? (
            <motion.button
              onClick={() => setShowBio(true)}
              className="text-blue-600 hover:underline font-medium cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t("home.bio.buttonRead")}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="whitespace-pre-line text-[var(--foreground)] leading-relaxed">
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

              <motion.button
                onClick={() => setShowBio(false)}
                className="text-blue-600 hover:underline font-medium mt-3 block cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t("home.bio.buttonHide")}
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="mt-6 sm:mt-8 border-t border-gradient-to-r from-transparent via-[var(--border)] to-transparent pt-6 sm:pt-8"
          variants={itemVariants}
        >
          <div className="flex justify-center space-x-6">
            <Suspense
              fallback={
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              }
            >
              <motion.a
                href="https://"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] hover:text-[var(--primary)]/80 text-2xl cursor-pointer"
                aria-label={t("home.social.facebook")}
                whileHover={{
                  scale: 1.2,
                  rotate: 5,
                  color: "var(--primary)",
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <FaFacebook />
              </motion.a>
            </Suspense>
            <Suspense
              fallback={
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              }
            >
              <motion.a
                href="https://"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-800 text-2xl cursor-pointer"
                aria-label={t("home.social.youtube")}
                whileHover={{
                  scale: 1.2,
                  rotate: -5,
                  color: "#dc2626",
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <FaYoutube />
              </motion.a>
            </Suspense>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default Home;
