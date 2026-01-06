"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Send, Bot, User, Loader2, Sparkles, X } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function AIAssistant() {
  const { t, locale } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch");
      }

      const text = await response.text();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: text,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          locale === "he"
            ? "מצטער, משהו השתבש. נסה שוב."
            : "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
    setInputValue("");
  };

  const placeholderText =
    locale === "he"
      ? "שאל אותי איך לעשות משהו..."
      : "Ask me how to do something...";

  const suggestedQuestions =
    locale === "he"
      ? ["איך יוצרים הרצאה חדשה?", "איך מנהלים קטגוריות?", "איך רואים הודעות?"]
      : [
          "How do I create a new lecture?",
          "How do I manage categories?",
          "How do I view messages?",
        ];

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <section aria-labelledby="ai-assistant-heading">
      <h3
        id="ai-assistant-heading"
        className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100"
      >
        <Sparkles className="w-4 h-4 text-purple-500" />
        {t("settings.aiAssistant.title")}
      </h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {t("settings.aiAssistant.description")}
      </p>

      <div className="mt-3">
        {!isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium text-sm hover:from-purple-600 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
          >
            <Bot className="w-4 h-4" />
            {t("settings.aiAssistant.startChat")}
          </button>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {t("settings.aiAssistant.title")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="p-1 rounded hover:bg-white/20 transition-colors text-xs"
                    title={locale === "he" ? "נקה צ'אט" : "Clear chat"}
                  >
                    {locale === "he" ? "נקה" : "Clear"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-64 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {t("settings.aiAssistant.emptyState")}
                  </p>
                  <div className="space-y-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestedQuestion(question)}
                        className="block w-full text-left px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              id="ai-chat-form"
              onSubmit={handleSubmit}
              className="flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholderText}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-3 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={locale === "he" ? "שלח" : "Send"}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
