"use client";

import React, { useState, useEffect } from "react";

const Clock: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jerusalem",
    })
    .replace(/^(\d):/, "0$1:");

  const formattedDate = time.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Jerusalem",
  });

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-md bg-gray-100 dark:bg-gray-800 cursor-pointer transition-colors duration-200 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-700"
      onClick={toggleVisibility}
    >
      {isVisible && (
        <>
          <span className="text-base font-semibold text-gray-800 dark:text-gray-100 font-mono">
            {formattedTime}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {formattedDate}
          </span>
        </>
      )}
    </div>
  );
};

export default Clock;
