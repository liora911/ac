"use client";

import { EventCategory, Event } from "@/types/Events/events";
import React, { useState, useEffect, useRef } from "react";

const CategoryTree: React.FC<{
  categories: EventCategory[];
  onSelectCategory: (category: EventCategory) => void;
  level?: number;
  expandedCategories: Record<string, boolean>;
  toggleCategory: (categoryId: string) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryIdDirectly: (id: string) => void;
}> = ({
  categories,
  onSelectCategory,
  level = 0,
  expandedCategories,
  toggleCategory,
  selectedCategoryId,
  setSelectedCategoryIdDirectly,
}) => {
  return (
    <ul className={`ml-${level * 4} space-y-1`}>
      {categories.map((category) => (
        <li key={category.id}>
          <div
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors
                        ${
                          selectedCategoryId === category.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800"
                        }`}
            onClick={() => {
              if (category.subcategories && category.subcategories.length > 0) {
                toggleCategory(category.id);
              }
              onSelectCategory(category);
              setSelectedCategoryIdDirectly(category.id);
            }}
          >
            <span className="font-medium">
              {category.name} ({category.events.length})
            </span>
            {category.subcategories && category.subcategories.length > 0 && (
              <span
                className={`transform transition-transform ${
                  expandedCategories[category.id] ? "rotate-90" : "rotate-0"
                }`}
              >
                ▶
              </span>
            )}
          </div>
          {category.subcategories && expandedCategories[category.id] && (
            <CategoryTree
              categories={category.subcategories}
              onSelectCategory={onSelectCategory}
              level={level + 1}
              expandedCategories={expandedCategories}
              toggleCategory={toggleCategory}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryIdDirectly={setSelectedCategoryIdDirectly}
            />
          )}
        </li>
      ))}
    </ul>
  );
};

interface EventsProps {
  onBannerUpdate: (imageUrl: string | null, altText: string) => void;
  eventData: EventCategory[];
}

const Events: React.FC<EventsProps> = ({ onBannerUpdate, eventData }) => {
  const hasInitializedRef = useRef(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [currentCategoryBanner, setCurrentCategoryBanner] = useState<
    string | null
  >(null);
  const [selectedCategoryName, setSelectedCategoryName] =
    useState<string>("טוען אירועים...");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const handleSelectCategory = (category: EventCategory) => {
    setSelectedEvents(category.events);
    setSelectedCategoryName(category.name);
    const bannerUrl = category.bannerImageUrl || null;
    setCurrentCategoryBanner(bannerUrl);
    onBannerUpdate(bannerUrl, category.name);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  useEffect(() => {
    if (!eventData || hasInitializedRef.current) return;

    hasInitializedRef.current = true;

    if (eventData.length === 0) {
      setSelectedEvents([]);
      onBannerUpdate(null, "אירועים");
      setCurrentCategoryBanner(null);
      setSelectedCategoryName("אין אירועים זמינים");
      return;
    }

    setSelectedEvents([]);
    setSelectedCategoryName("בחר קטגוריה מהתפריט");

    const firstCategory = eventData[0];
    const initialBanner = firstCategory?.bannerImageUrl || null;
    setCurrentCategoryBanner(initialBanner);
    onBannerUpdate(initialBanner, firstCategory?.name || "אירועים");
  }, [eventData, onBannerUpdate]);

  const handleEventClick = (event: Event) => {
    onBannerUpdate(
      event.bannerImageUrl || currentCategoryBanner || null,
      event.title
    );
  };

  if (!eventData) {
    return (
      <div
        className="flex justify-center items-center h-64 bg-gray-900 text-gray-400 text-xl"
        style={{ direction: "rtl" }}
      >
        טוען נתוני אירועים...
      </div>
    );
  }

  if (eventData.length === 0) {
    return (
      <div
        className="flex justify-center items-center h-64 bg-gray-900 text-gray-400 text-xl"
        style={{ direction: "rtl" }}
      >
        אין אירועים זמינים כרגע.
      </div>
    );
  }

  return (
    <div
      className="flex flex-col md:flex-row gap-8 p-4 md:p-6 bg-gray-900 text-gray-100 min-h-[calc(100vh-200px)]"
      style={{ direction: "rtl" }}
    >
      <aside className="w-full md:w-1/4 lg:w-1/5 bg-gray-850 p-4 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">
          קטגוריות
        </h3>
        <CategoryTree
          categories={eventData}
          onSelectCategory={handleSelectCategory}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryIdDirectly={setSelectedCategoryId}
        />
      </aside>

      <main className="w-full md:w-3/4 lg:w-4/5">
        <h2 className="text-3xl font-bold mb-6 text-white">
          אירועים בנושא:{" "}
          <span className="text-blue-400">{selectedCategoryName}</span>
        </h2>
        {selectedEvents.length > 0 ? (
          <div className="space-y-6">
            {selectedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-blue-500/30 transition-shadow cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <h4 className="text-2xl font-semibold mb-2 text-blue-400">
                  {event.title}
                </h4>
                <p className="text-gray-300 mb-3">{event.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>
                    תאריך:{" "}
                    {new Date(event.eventDate).toLocaleDateString("he-IL")}
                  </span>
                  {event.eventTime && <span>שעה: {event.eventTime}</span>}
                </div>
                {event.location && (
                  <div className="mt-2 text-sm text-gray-400">
                    מיקום: {event.location}
                  </div>
                )}
                {event.onlineUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400 mb-1">
                      קישור לאירוע מקוון:
                    </p>
                    <a
                      href={event.onlineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {event.onlineUrl}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-lg">
            אנא בחר קטגוריה כדי להציג אירועים, או שאין אירועים זמינים בקטגוריה
            זו.
          </p>
        )}
      </main>
    </div>
  );
};

export default Events;
