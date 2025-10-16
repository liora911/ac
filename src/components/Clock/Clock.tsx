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
      className="flex items-center gap-4 cursor-pointer"
      onClick={toggleVisibility}
    >
      {isVisible && (
        <>
          <span className="text-lg font-mono">{formattedTime}</span>
          <span className="text-xs">{formattedDate}</span>
        </>
      )}
    </div>
  );
};

export default Clock;
