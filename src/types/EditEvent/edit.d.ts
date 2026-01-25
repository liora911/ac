import type { CategoryNode } from "@/types/Category/category";

export type { CategoryNode };

export interface EditEventFormProps {
  eventId: string;
  onSuccess?: () => void;
}
