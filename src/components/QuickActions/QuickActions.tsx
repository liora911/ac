"use client";

import React from "react";
import { useRouter } from "next/navigation";

const QuickActions: React.FC = () => {
  const router = useRouter();

  const actions = [
    {
      label: "מאמר חדש",
      icon: "✍️",
      description: "צור מאמר חדש",
      path: "/articles/create",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "אירוע חדש",
      icon: "📅",
      description: "תכנן אירוע חדש",
      path: "/create-event",
      color: "from-green-500 to-green-600",
    },
    {
      label: "הרצאה חדשה",
      icon: "🎓",
      description: "הוסף הרצאה חדשה",
      path: "/create-lecture",
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "מצגת חדשה",
      icon: "📊",
      description: "צור מצגת חדשה",
      path: "/edit-presentation/new",
      color: "from-orange-500 to-orange-600",
    },
  ];

  const handleActionClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="p-6 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        פעולות מהירות
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action.path)}
            className={`p-4 rounded-lg bg-gradient-to-br ${action.color} text-white hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left group`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl">{action.icon}</div>
              <div className="font-semibold text-sm">{action.label}</div>
            </div>
            <div className="text-xs opacity-90">{action.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
