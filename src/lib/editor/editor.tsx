"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "כתוב את תוכן המאמר כאן...",
  className = "",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    autofocus: true,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] p-3 focus:outline-none rtl prose prose-sm max-w-none",
        style: "direction: rtl;",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-sm border border-gray-300 hover:bg-gray-200 focus:bg-gray-200 ${
        isActive ? "bg-blue-100 border-blue-300" : ""
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-md">
        <div className="flex flex-wrap gap-1">
          {/* Format buttons */}
          <div className="flex border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => {
                editor?.commands.toggleBold();
                editor?.commands.focus();
              }}
              isActive={editor?.isActive("bold")}
              title="Bold (Ctrl+B)"
            >
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor?.commands.toggleItalic();
                editor?.commands.focus();
              }}
              isActive={editor?.isActive("italic")}
              title="Italic (Ctrl+I)"
            >
              <em>I</em>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor?.commands.toggleUnderline();
                editor?.commands.focus();
              }}
              isActive={editor?.isActive("underline")}
              title="Underline (Ctrl+U)"
            >
              <u>U</u>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor?.commands.toggleStrike();
                editor?.commands.focus();
              }}
              isActive={editor?.isActive("strike")}
              title="Strikethrough"
            >
              <s>S</s>
            </ToolbarButton>
          </div>

          {/* List buttons */}
          <div className="flex border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => {
                editor?.commands.toggleBulletList();
                editor?.commands.focus();
              }}
              isActive={editor?.isActive("bulletList")}
              title="Bullet List"
            >
              •
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor?.commands.toggleOrderedList();
                editor?.commands.focus();
              }}
              isActive={editor?.isActive("orderedList")}
              title="Numbered List"
            >
              1.
            </ToolbarButton>
          </div>

          {/* Alignment buttons */}
          <div className="flex border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => {
                editor?.commands.setTextAlign("left");
                editor?.commands.focus();
              }}
              isActive={editor?.isActive({ textAlign: "left" })}
              title="Align Left"
            >
              ⟵
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor?.commands.setTextAlign("center");
                editor?.commands.focus();
              }}
              isActive={editor?.isActive({ textAlign: "center" })}
              title="Align Center"
            >
              ⟷
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor?.commands.setTextAlign("right");
                editor?.commands.focus();
              }}
              isActive={editor?.isActive({ textAlign: "right" })}
              title="Align Right"
            >
              ⟶
            </ToolbarButton>
          </div>

          {/* Heading buttons */}
          <div className="flex">
            <ToolbarButton
              onClick={() => {
                editor?.commands.toggleHeading({ level: 2 });
                editor?.commands.focus();
              }}
              isActive={editor?.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor?.commands.toggleHeading({ level: 3 });
                editor?.commands.focus();
              }}
              isActive={editor?.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              H3
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                editor?.commands.setParagraph();
                editor?.commands.focus();
              }}
              isActive={editor?.isActive("paragraph")}
              title="Paragraph"
            >
              P
            </ToolbarButton>
          </div>
        </div>
      </div>

      <EditorContent
        editor={editor}
        className="focus-within:ring-2 focus-within:ring-blue-500 rounded-b-md"
      />

      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p {
          margin: 0.5em 0;
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
      `}</style>
    </div>
  );
}
