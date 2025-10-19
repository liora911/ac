"use client";

import { useState } from "react";
import Image from "next/image";

const options = [
  { value: "he", label: "", flag: "/flags/israel-flag-icon.svg" },
  { value: "en", label: "", flag: "/flags/united-states-flag-icon.svg" },
];

export default function LocaleSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: "en" | "he") => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value)!;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 hover:border-blue-500 transition-colors duration-200 cursor-pointer"
      >
        <Image
          src={selected.flag}
          alt={selected.label}
          width={20}
          height={15}
        />
        <svg
          className="w-4 h-4 ml-1 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-14 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value as "en" | "he");
                setOpen(false);
              }}
              className="w-full flex items-center justify-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
            >
              <Image src={opt.flag} alt={opt.label} width={20} height={15} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
