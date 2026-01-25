export type AIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type UseAIChatOptions = {
  isAdmin?: boolean;
  locale?: string;
};
