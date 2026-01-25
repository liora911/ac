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
import Youtube from "@tiptap/extension-youtube";
import { useEffect, useState, useRef } from "react";
import { TextDirection } from "./text-direction";
import DragDropImageUpload from "@/components/Upload/upload";
import { FontSize } from "./extensions/FontSize";
import { LineHeight } from "./extensions/LineHeight";
import { Indent } from "./extensions/Indent";
import { TiptapEditorProps } from "@/types/Editor/editor";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  RemoveFormatting,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Youtube as YoutubeIcon,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  IndentIncrease,
  IndentDecrease,
  Type,
  Mic,
  MicOff,
} from "lucide-react";

import type { TooltipProps, DropdownProps } from "@/types/Editor/tiptap-editor";

// Tooltip Component
const Tooltip = ({ children, text }: TooltipProps) => {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

// Dropdown Component
const Dropdown = ({
  trigger,
  children,
  isOpen,
  onToggle,
}: DropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button" onClick={onToggle} className="flex items-center">
        {trigger}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
          {children}
        </div>
      )}
    </div>
  );
};

// TypeScript declaration for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
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
  const [currentDirection, setCurrentDirection] = useState<"ltr" | "rtl">(direction);
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageWidth, setImageWidth] = useState("");
  const [imageHeight, setImageHeight] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Speech-to-text state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognitionAPI);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline hover:text-blue-800" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full h-auto" },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlock,
      Blockquote,
      HorizontalRule,
      TextDirection.configure({ types: ["heading", "paragraph", "listItem"] }),
      FontSize,
      LineHeight,
      Indent,
      Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: `p-4 focus:outline-none prose prose-sm max-w-none ${
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

  useEffect(() => {
    if (editor && direction !== currentDirection) {
      setCurrentDirection(direction);
      editor.chain().focus().setTextDirection(direction).run();
    }
  }, [direction, editor, currentDirection]);

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (!speechSupported || !editor) return;

    if (isListening) {
      // Stop listening
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Start listening
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = currentDirection === "rtl" ? "he-IL" : "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }

      if (finalTranscript && editor) {
        // Insert the transcribed text at cursor position
        editor.chain().focus().insertContent(finalTranscript + " ").run();
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  if (!editor) return null;

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
  }) => (
    <Tooltip text={title}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
          disabled
            ? "opacity-40 cursor-not-allowed"
            : "cursor-pointer hover:bg-gray-100"
        } ${isActive ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
      >
        {children}
      </button>
    </Tooltip>
  );

  const DropdownItem = ({
    onClick,
    isActive,
    icon: Icon,
    label,
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon?: any;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => {
        onClick();
        setOpenDropdown(null);
      }}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
        isActive ? "bg-blue-50 text-blue-600" : "text-gray-700"
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setIsLinkModalOpen(false);
    }
  };

  const addImage = () => {
    if (imageUrl) {
      const attrs: any = { src: imageUrl };
      if (imageWidth) attrs.width = imageWidth;
      if (imageHeight) attrs.height = imageHeight;
      editor.chain().focus().setImage(attrs).run();
      setImageUrl("");
      setImageWidth("");
      setImageHeight("");
      setIsImageModalOpen(false);
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addVideo = () => {
    if (videoUrl) {
      editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run();
      setVideoUrl("");
      setIsVideoModalOpen(false);
    }
  };

  const getActiveHeading = () => {
    if (editor.isActive("heading", { level: 1 })) return "H1";
    if (editor.isActive("heading", { level: 2 })) return "H2";
    if (editor.isActive("heading", { level: 3 })) return "H3";
    return "P";
  };

  const getActiveAlignment = () => {
    if (editor.isActive({ textAlign: "center" })) return AlignCenter;
    if (editor.isActive({ textAlign: "right" })) return AlignRight;
    if (editor.isActive({ textAlign: "justify" })) return AlignJustify;
    return AlignLeft;
  };

  const ActiveAlignIcon = getActiveAlignment();

  return (
    <div className={`border border-gray-200 rounded-xl bg-white flex flex-col ${className}`}>
      {/* Toolbar - Fixed at top of editor */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50 p-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Heading Dropdown */}
          <div className="px-1">
            <Dropdown
              isOpen={openDropdown === "heading"}
              onToggle={() => setOpenDropdown(openDropdown === "heading" ? null : "heading")}
              trigger={
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700">
                  <Type className="w-4 h-4" />
                  <span>{getActiveHeading()}</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              }
            >
              <DropdownItem
                onClick={() => editor.chain().focus().setParagraph().run()}
                isActive={editor.isActive("paragraph")}
                icon={Pilcrow}
                label="Paragraph"
              />
              <DropdownItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive("heading", { level: 1 })}
                icon={Heading1}
                label="Heading 1"
              />
              <DropdownItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive("heading", { level: 2 })}
                icon={Heading2}
                label="Heading 2"
              />
              <DropdownItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive("heading", { level: 3 })}
                icon={Heading3}
                label="Heading 3"
              />
            </Dropdown>
          </div>

          {/* Font Size Dropdown */}
          <div className="px-1">
            <Dropdown
              isOpen={openDropdown === "fontSize"}
              onToggle={() => setOpenDropdown(openDropdown === "fontSize" ? null : "fontSize")}
              trigger={
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700">
                  <span>Size</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              }
            >
              {["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"].map((size) => (
                <DropdownItem
                  key={size}
                  onClick={() => editor.chain().focus().setFontSize(size).run()}
                  label={size}
                />
              ))}
              <DropdownItem
                onClick={() => editor.chain().focus().unsetFontSize().run()}
                label="Default"
              />
            </Dropdown>
          </div>

          {/* Line Height Dropdown */}
          <div className="px-1 border-r border-gray-200">
            <Dropdown
              isOpen={openDropdown === "lineHeight"}
              onToggle={() => setOpenDropdown(openDropdown === "lineHeight" ? null : "lineHeight")}
              trigger={
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700">
                  <span>Line</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              }
            >
              {["0.8", "0.9", "1", "1.15", "1.25", "1.5", "1.75", "2", "2.5"].map((height) => (
                <DropdownItem
                  key={height}
                  onClick={() => editor.chain().focus().setLineHeight(height).run()}
                  label={
                    height === "0.8" ? "Tight (0.8)" :
                    height === "0.9" ? "Compact (0.9)" :
                    height === "1" ? "Single" :
                    height === "1.15" ? "Normal (1.15)" :
                    height === "1.5" ? "1.5 Lines" :
                    height === "2" ? "Double" :
                    height
                  }
                />
              ))}
              <DropdownItem
                onClick={() => editor.chain().focus().unsetLineHeight().run()}
                label="Default"
              />
            </Dropdown>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center gap-0.5 px-2 border-l border-r border-gray-200">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive("code")}
              title="Inline Code"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetAllMarks().run()}
              title="Clear Formatting"
            >
              <RemoveFormatting className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1 px-2 border-r border-gray-200">
            <Tooltip text="Text Color">
              <input
                type="color"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer p-0.5"
              />
            </Tooltip>
            <Tooltip text="Highlight">
              <input
                type="color"
                onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer p-0.5"
                defaultValue="#ffff00"
              />
            </Tooltip>
          </div>

          {/* Alignment Dropdown */}
          <div className="px-1">
            <Dropdown
              isOpen={openDropdown === "align"}
              onToggle={() => setOpenDropdown(openDropdown === "align" ? null : "align")}
              trigger={
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-100 text-gray-700">
                  <ActiveAlignIcon className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </div>
              }
            >
              <DropdownItem
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                isActive={editor.isActive({ textAlign: "left" })}
                icon={AlignLeft}
                label="Align Left"
              />
              <DropdownItem
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                isActive={editor.isActive({ textAlign: "center" })}
                icon={AlignCenter}
                label="Align Center"
              />
              <DropdownItem
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                isActive={editor.isActive({ textAlign: "right" })}
                icon={AlignRight}
                label="Align Right"
              />
              <DropdownItem
                onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                isActive={editor.isActive({ textAlign: "justify" })}
                icon={AlignJustify}
                label="Justify"
              />
            </Dropdown>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-0.5 px-2 border-l border-r border-gray-200">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive("taskList")}
              title="Task List"
            >
              <CheckSquare className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().indent().run()} title="Indent">
              <IndentIncrease className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().outdent().run()} title="Outdent">
              <IndentDecrease className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Blocks */}
          <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Line"
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Insert Dropdown */}
          <div className="px-1">
            <Dropdown
              isOpen={openDropdown === "insert"}
              onToggle={() => setOpenDropdown(openDropdown === "insert" ? null : "insert")}
              trigger={
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700">
                  <span>Insert</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              }
            >
              <DropdownItem
                onClick={() => { setIsLinkModalOpen(true); setOpenDropdown(null); }}
                icon={LinkIcon}
                label="Link"
              />
              <DropdownItem
                onClick={() => { setIsImageModalOpen(true); setOpenDropdown(null); }}
                icon={ImageIcon}
                label="Image"
              />
              <DropdownItem onClick={addTable} icon={TableIcon} label="Table" />
              <DropdownItem
                onClick={() => { setIsVideoModalOpen(true); setOpenDropdown(null); }}
                icon={YoutubeIcon}
                label="YouTube Video"
              />
            </Dropdown>
          </div>

          {/* Speech-to-Text & Direction Toggle */}
          <div className="ml-auto flex items-center gap-1">
            {speechSupported && (
              <ToolbarButton
                onClick={toggleSpeechRecognition}
                isActive={isListening}
                title={isListening ? "Stop Dictation" : "Start Dictation"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </ToolbarButton>
            )}
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
              <span className="text-xs font-bold">{currentDirection === "rtl" ? "RTL" : "LTR"}</span>
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insert Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full p-3 border border-gray-200 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addLink}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Insert Image</h3>

            {/* Drag & Drop Upload - reusing existing component */}
            <DragDropImageUpload
              onImageSelect={(url) => setImageUrl(url || "")}
              currentImage={imageUrl || null}
              placeholder="PNG, JPG, GIF, WebP (max 5MB)"
              onError={(msg) => alert(msg)}
            />

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-600" />
              <span className="text-sm text-gray-400">or paste URL</span>
              <div className="flex-1 h-px bg-gray-600" />
            </div>

            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-3 mb-4">
              <input
                type="number"
                value={imageWidth}
                onChange={(e) => setImageWidth(e.target.value)}
                placeholder="Width (px)"
                className="flex-1 p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                value={imageHeight}
                onChange={(e) => setImageHeight(e.target.value)}
                placeholder="Height (px)"
                className="flex-1 p-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsImageModalOpen(false);
                  setImageUrl("");
                  setImageWidth("");
                  setImageHeight("");
                }}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addImage}
                disabled={!imageUrl}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insert YouTube Video</h3>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full p-3 border border-gray-200 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addVideo}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Add Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content - Scrollable area */}
      <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[500px]">
        <EditorContent
          editor={editor}
          className="focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-inset"
        />
      </div>

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
          border-left: 3px solid #d1d5db;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
        }
        .ProseMirror code {
          background: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .ProseMirror pre {
          background: #1f2937;
          color: #e5e7eb;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
        }
        .ProseMirror td,
        .ProseMirror th {
          border: 1px solid #d1d5db;
          padding: 0.5em;
        }
        .ProseMirror th {
          background: #f9fafb;
          font-weight: 600;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
        }
        .ProseMirror .is-editor-empty:first-child::before {
          color: #9ca3af;
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
          gap: 0.5em;
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
