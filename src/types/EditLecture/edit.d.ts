export interface EditLectureFormProps {
  lectureId: string;
  onSuccess?: () => void;
}

export type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
};
