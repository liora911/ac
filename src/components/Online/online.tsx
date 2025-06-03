import React from "react";
import { onlineEventsData } from "@/constants/Online/data";

const Online = () => {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0b0b0c] via-slate-800 to-[#0b0b0c] text-gray-100 py-8 px-4"
      style={{ direction: "rtl" }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-white">
          אירועי אונליין (Zoom)
        </h1>
        {onlineEventsData.map((group) => (
          <section key={group.monthYear} className="mb-10">
            <h2 className="text-2xl font-semibold border-b-2 border-gray-700 pb-3 mb-6 text-gray-300">
              {group.monthYear}
            </h2>
            <ul className="space-y-4">
              {group.events.map((event) => (
                <li
                  key={event.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-5 shadow-md w-full"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1 sm:mb-0">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {event.day}, {event.date} ({event.time})
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap
                        ${
                          event.status === "Sold Out"
                            ? "bg-red-600 text-white"
                            : event.status === "Register"
                            ? "bg-blue-500 text-white"
                            : "bg-green-500 text-white"
                        }`}
                    >
                      {event.eventLink &&
                      (event.status === "Register" ||
                        event.status === "Join Link") ? (
                        <a
                          href={event.eventLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {event.status === "Register" ? "הרשמה" : "הצטרפות"}
                        </a>
                      ) : event.status === "Sold Out" ? (
                        "ההרשמה נסגרה"
                      ) : (
                        "פרטים בקרוב"
                      )}
                    </span>
                  </div>
                  <p className="text-gray-300">
                    <strong>פלטפורמה:</strong> {event.platform}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Online;
