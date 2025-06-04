interface PresentationCardProps {
  id: string;
  title: string;
  imageUrls: string[];
  description: string;
}

export interface PresentationDetailProps extends PresentationCardProps {
  content: string;
}
