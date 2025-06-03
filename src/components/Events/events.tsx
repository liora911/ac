import { eventsData } from "@/constants/Events/data";
import React from "react";

const Events = () => {
  return (
    <div
      className="min-h-screen bg-[#0b0b0c] text-gray-100 py-8 px-4"
      style={{ direction: "rtl" }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-white">
          אירועים קרובים
        </h1>
        {eventsData.map((group) => (
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
                    <h3 className="text-xl font-semibold text-white mb-2 sm:mb-0">
                      {event.day} {event.date}{" "}
                      <span className="text-sm text-gray-400">
                        ({event.time})
                      </span>
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium
                        ${
                          event.status === "Sold Out"
                            ? "bg-red-600 text-white"
                            : "bg-green-500 text-white"
                        }`}
                    >
                      {event.status === "Buy Tickets" && event.ticketLink ? (
                        <a
                          href={event.ticketLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          רכישת כרטיסים
                        </a>
                      ) : event.status === "Sold Out" ? (
                        "אזלו הכרטיסים"
                      ) : (
                        "כרטיסים בקרוב"
                      )}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-1">
                    <strong>מיקום:</strong> {event.location}
                  </p>
                  <p className="text-gray-300">
                    <strong>אולם:</strong> {event.venue}
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

export default Events;
