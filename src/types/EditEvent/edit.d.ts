export type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
};

export interface EditEventFormProps {
  eventId: string;
  onSuccess?: () => void;
}
