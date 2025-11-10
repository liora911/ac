"use client";

import React, { useState, useEffect } from "react";

interface Quote {
  text: string;
  author: string;
}

const MotivationalQuote: React.FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  const quotes: Quote[] = [
    {
      text: "הצלחה היא לא סופית, כישלון הוא לא קטלני: החשיבות היא האומץ להמשיך.",
      author: "וינסטון צ'רצ'יל",
    },
    {
      text: "הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו.",
      author: "פיטר דרוקר",
    },
    {
      text: "אל תחכה להזדמנויות, צור אותן.",
      author: "כריס גרוסר",
    },
    {
      text: "החיים הם 10% מה שקורה לך ו-90% איך שאתה מגיב על זה.",
      author: "צ'ארלס סוינדול",
    },
    {
      text: "ההבדל בין המצליח לבין הכישלון הוא שהמצליח ממשיך לנסות.",
      author: "וולט דיסני",
    },
    {
      text: "כל יום הוא הזדמנות חדשה להתחיל מחדש.",
      author: "אלברט איינשטיין",
    },
  ];

  useEffect(() => {
    // Select a random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-lg bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 animate-pulse">
        <div className="h-16 bg-rose-300 rounded mb-4"></div>
        <div className="h-4 bg-rose-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 shadow-sm">
      <div className="text-center">
        <div className="text-3xl mb-4">💭</div>
        <blockquote className="text-lg font-medium text-gray-800 mb-3 leading-relaxed">
          "{quote?.text}"
        </blockquote>
        <cite className="text-sm text-gray-600 font-medium">
          — {quote?.author}
        </cite>
      </div>
    </div>
  );
};

export default MotivationalQuote;
