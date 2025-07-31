"use client";

import { useState, useRef } from "react";

interface BasicEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function BasicEditor({
  value,
  onChange,
  placeholder = "כתוב את תוכן המאמר כאן...",
  className = "",
}: BasicEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const formatButtons = [
    {
      command: "bold",
      icon: "B",
      title: "Bold (Ctrl+B)",
      style: "font-bold",
    },
    {
      command: "italic",
      icon: "I",
      title: "Italic (Ctrl+I)",
      style: "italic",
    },
    {
      command: "underline",
      icon: "U",
      title: "Underline (Ctrl+U)",
      style: "underline",
    },
    {
      command: "strikeThrough",
      icon: "S",
      title: "Strikethrough",
      style: "line-through",
    },
  ];

  const listButtons = [
    {
      command: "insertUnorderedList",
      icon: "•",
      title: "Bullet List",
    },
    {
      command: "insertOrderedList",
      icon: "1.",
      title: "Numbered List",
    },
  ];

  const alignButtons = [
    {
      command: "justifyLeft",
      icon: "⟵",
      title: "Align Left",
    },
    {
      command: "justifyCenter",
      icon: "⟷",
      title: "Align Center",
    },
    {
      command: "justifyRight",
      icon: "⟶",
      title: "Align Right",
    },
  ];

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-md">
        <div className="flex flex-wrap gap-1">
          {/* Format buttons */}
          <div className="flex border-r border-gray-300 pr-2 mr-2">
            {formatButtons.map((button) => (
              <button
                key={button.command}
                type="button"
                onClick={() => execCommand(button.command)}
                className={`px-3 py-1 text-sm border border-gray-300 hover:bg-gray-200 focus:bg-gray-200 ${button.style} first:rounded-l last:rounded-r`}
                title={button.title}
              >
                {button.icon}
              </button>
            ))}
          </div>

          <div className="flex border-r border-gray-300 pr-2 mr-2">
            {listButtons.map((button) => (
              <button
                key={button.command}
                type="button"
                onClick={() => execCommand(button.command)}
                className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-200 focus:bg-gray-200 first:rounded-l last:rounded-r"
                title={button.title}
              >
                {button.icon}
              </button>
            ))}
          </div>

          <div className="flex border-r border-gray-300 pr-2 mr-2">
            {alignButtons.map((button) => (
              <button
                key={button.command}
                type="button"
                onClick={() => execCommand(button.command)}
                className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-200 focus:bg-gray-200 first:rounded-l last:rounded-r"
                title={button.title}
              >
                {button.icon}
              </button>
            ))}
          </div>

          <div className="flex">
            <button
              type="button"
              onClick={() => execCommand("formatBlock", "h2")}
              className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-200 focus:bg-gray-200 rounded-l"
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => execCommand("formatBlock", "h3")}
              className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-200 focus:bg-gray-200"
              title="Heading 3"
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => execCommand("formatBlock", "p")}
              className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-200 focus:bg-gray-200 rounded-r"
              title="Paragraph"
            >
              P
            </button>
          </div>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        className={`min-h-[200px] p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none rtl ${
          isActive ? "ring-2 ring-blue-500" : ""
        }`}
        style={{ direction: "rtl" }}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
