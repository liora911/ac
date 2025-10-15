"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlock from "@tiptap/extension-code-block";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { useEffect, useState } from "react";
import { TextDirection } from "./text-direction";
import { FontSize } from "./extensions/FontSize";
import { LineHeight } from "./extensions/LineHeight";
import { Indent } from "./extensions/Indent";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  theme?: "light" | "dark";
  direction?: "ltr" | "rtl";
  onDirectionChange?: (direction: "ltr" | "rtl") => void;
}

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "כתוב את תוכן המאמר כאן...",
  className = "",
  theme = "light",
  direction = "ltr",
  onDirectionChange,
}: TiptapEditorProps) {
  const [currentDirection, setCurrentDirection] = useState<"ltr" | "rtl">(
    direction
  );
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false, // Fix Tiptap SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlock,
      Blockquote,
      HorizontalRule,
      TextDirection.configure({
        types: ["heading", "paragraph", "listItem"],
      }),
      FontSize,
      LineHeight,
      Indent,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: `min-h-[300px] p-4 focus:outline-none prose prose-sm max-w-none ${
          theme === "dark" ? "prose-invert" : ""
        }`,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // In your TiptapEditor component
  useEffect(() => {
    if (editor && direction !== currentDirection) {
      setCurrentDirection(direction);
      editor.chain().focus().setTextDirection(direction).run();
    }
  }, [direction, editor, currentDirection]);

  if (!editor) {
    return null;
  }
  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
    disabled = false,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
  }) => {
    const baseClasses =
      "px-2 py-1 text-xs border disabled:opacity-50 disabled:cursor-not-allowed";
    const themeClasses =
      theme === "dark"
        ? `border-gray-600 text-white hover:bg-gray-700 focus:bg-gray-700 ${
            isActive ? "bg-blue-600 border-blue-500" : ""
          }`
        : `border-gray-300 hover:bg-gray-200 focus:bg-gray-200 ${
            isActive ? "bg-blue-100 border-blue-300" : ""
          }`;

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${themeClasses}`}
        title={title}
      >
        {children}
      </button>
    );
  };

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setIsLinkModalOpen(false);
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setIsImageModalOpen(false);
    }
  };

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div
      className={`border rounded-md ${
        theme === "dark" ? "border-gray-600" : "border-gray-300"
      } ${className}`}
    >
      {/* Toolbar */}
      <div
        className={`border-b p-2 rounded-t-md overflow-x-auto ${
          theme === "dark"
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="flex flex-wrap gap-1 min-w-max">
          {/* Text Formatting */}
          <div
            className={`flex border-r pr-2 mr-2 ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            }`}
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold (Ctrl+B)"
            >
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
            >
              <em>I</em>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="Underline (Ctrl+U)"
            >
              <u>U</u>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough"
            >
              <s>S</s>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive("code")}
              title="Inline Code"
            >
              {"</>"}
            </ToolbarButton>
          </div>

          {/* Colors & Highlight */}
          <div
            className={`flex border-r pr-2 mr-2 ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            }`}
          >
            <input
              type="color"
              onChange={(e) =>
                editor.chain().focus().setColor(e.target.value).run()
              }
              className={`w-8 h-6 border rounded cursor-pointer ${
                theme === "dark" ? "border-gray-600" : "border-gray-300"
              }`}
              title="Text Color"
            />
            <input
              type="color"
              onChange={(e) =>
                editor
                  .chain()
                  .focus()
                  .toggleHighlight({ color: e.target.value })
                  .run()
              }
              className={`w-8 h-6 border rounded cursor-pointer ml-1 ${
                theme === "dark" ? "border-gray-600" : "border-gray-300"
              }`}
              title="Highlight Color"
            />
          </div>

          {/* Headings */}
          <div
            className={`flex border-r pr-2 mr-2 ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            }`}
          >
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              H3
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setParagraph().run()}
              isActive={editor.isActive("paragraph")}
              title="Paragraph"
            >
              P
            </ToolbarButton>
          </div>

          {/* Lists */}
          <div
            className={`flex border-r pr-2 mr-2 ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            }`}
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              •
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered List"
            >
              1.
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive("taskList")}
              title="Task List"
            >
              ☑
            </ToolbarButton>
          </div>

          {/* Alignment */}
          <div
            className={`flex border-r pr-2 mr-2 ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            }`}
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              title="Align Left"
            >
              ⟵
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              isActive={editor.isActive({ textAlign: "center" })}
              title="Align Center"
            >
              ⟷
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              title="Align Right"
            >
              ⟶
            </ToolbarButton>
          </div>

          {/* Special Elements */}
          <div
            className={`flex border-r pr-2 mr-2 ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            }`}
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="Blockquote"
            >
              "
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive("codeBlock")}
              title="Code Block"
            >
              📄
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              ―
            </ToolbarButton>
          </div>

          {/* Links & Media */}
          <div
            className={`flex border-r pr-2 mr-2 ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            }`}
          >
            <ToolbarButton
              onClick={() => setIsLinkModalOpen(true)}
              title="Insert Link"
            >
              🔗
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setIsImageModalOpen(true)}
              title="Insert Image"
            >
              🖼
            </ToolbarButton>
            <ToolbarButton onClick={addTable} title="Insert Table">
              📊
            </ToolbarButton>
          </div>

          {/* Text Direction */}
          {/* Text Direction */}
          <div className="flex">
            <ToolbarButton
              onClick={() => {
                const newDirection = currentDirection === "ltr" ? "rtl" : "ltr";
                editor.chain().focus().setTextDirection(newDirection).run();
                setCurrentDirection(newDirection);
                onDirectionChange?.(newDirection);
              }}
              isActive={currentDirection === "rtl"}
              title="Toggle Text Direction (RTL/LTR)"
            >
              {currentDirection === "rtl" ? "RTL" : "LTR"}
            </ToolbarButton>
          </div>
          {/* <div className="flex">
            <ToolbarButton
              onClick={() => {
                // Toggle RTL class on the editor content
                const currentElement = editor.view.dom;
                const hasRTL = currentElement.classList.contains("rtl-text");
                if (hasRTL) {
                  currentElement.classList.remove("rtl-text");
                  currentElement.style.direction = "";
                } else {
                  currentElement.classList.add("rtl-text");
                  currentElement.style.direction = "rtl";
                }
                // Also update the placeholder direction
                const placeholder =
                  currentElement.querySelector("[data-placeholder]");
                if (placeholder) {
                  (placeholder as HTMLElement).style.direction =
                    currentElement.style.direction;
                }
              }}
              title="Toggle Text Direction (RTL/LTR)"
            >
              ↔
            </ToolbarButton>
          </div> */}
        </div>
      </div>

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`p-4 rounded-lg shadow-lg ${
              theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Insert Link
            </h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className={`w-full p-2 border rounded mb-2 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "border-gray-300"
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={addLink}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Link
              </button>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className={`px-4 py-2 rounded ${
                  theme === "dark"
                    ? "bg-gray-600 text-white hover:bg-gray-700"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`p-4 rounded-lg shadow-lg ${
              theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Insert Image
            </h3>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={`w-full p-2 border rounded mb-2 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "border-gray-300"
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={addImage}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Image
              </button>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className={`px-4 py-2 rounded ${
                  theme === "dark"
                    ? "bg-gray-600 text-white hover:bg-gray-700"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={`focus-within:ring-2 focus-within:ring-blue-500 rounded-b-md ${
          theme === "dark" ? "text-white" : ""
        }`}
      />

      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror h1 {
          margin: 0.5em 0;
          font-size: 2em;
          font-weight: bold;
        }
        .ProseMirror h2 {
          margin: 0.5em 0;
          font-size: 1.5em;
          font-weight: bold;
        }
        .ProseMirror h3 {
          margin: 0.5em 0;
          font-size: 1.25em;
          font-weight: bold;
        }
        .ProseMirror ul {
          padding-left: 1.5em;
        }
        .ProseMirror ol {
          padding-left: 1.5em;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #ccc;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
        }
        .ProseMirror code {
          background: #f1f1f1;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
        }
        .ProseMirror pre {
          background: #f8f8f8;
          padding: 1em;
          border-radius: 4px;
          overflow-x: auto;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
        }
        .ProseMirror td,
        .ProseMirror th {
          border: 1px solid #ccc;
          padding: 0.5em;
        }
        .ProseMirror th {
          background: #f8f8f8;
          font-weight: bold;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
        }
        .ProseMirror .is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror-task-list {
          list-style: none;
          padding: 0;
        }
        .ProseMirror-task-item {
          display: flex;
          align-items: flex-start;
        }
        .ProseMirror-task-item > label {
          user-select: none;
        }
        .ProseMirror-task-item > div {
          flex: 1;
        }
        .ProseMirror[dir="rtl"] {
          direction: rtl;
        }
        .ProseMirror[dir="rtl"] [data-placeholder] {
          direction: rtl;
        }
      `}</style>
    </div>
  );
}
