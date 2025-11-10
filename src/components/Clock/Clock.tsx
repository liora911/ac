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
      className="flex items-center gap-2 p-2 rounded-md bg-gray-100 dark:bg-gray-800 cursor-pointer transition-colors duration-200 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
      onClick={toggleVisibility}
      role="button"
      tabIndex={0}
      aria-label={isVisible ? "Hide clock and date" : "Show clock and date"}
      aria-pressed={isVisible}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleVisibility();
        }
      }}
    >
      {isVisible && (
        <>
          <time
            className="text-base font-semibold text-gray-800 dark:text-gray-100 font-mono"
            dateTime={time.toISOString()}
            aria-label={`Current time: ${formattedTime}`}
          >
            {formattedTime}
          </time>
          <time
            className="text-xs text-gray-600 dark:text-gray-400"
            dateTime={time.toISOString().split("T")[0]}
            aria-label={`Current date: ${formattedDate}`}
          >
            {formattedDate}
          </time>
        </>
      )}
    </div>
  );
};

export default Clock;
