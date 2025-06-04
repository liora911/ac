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
        className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white"
      >
        <Image
          src={selected.flag}
          alt={selected.label}
          width={20}
          height={15}
        />
        <svg
          className="w-3 h-3 ml-1 text-gray-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-12 bg-white border rounded-md shadow z-10">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value as "en" | "he");
                setOpen(false);
              }}
              className="w-full px-2 py-1 hover:bg-gray-100"
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
