import EditEventForm from "@/components/EditEvent/edit_event";

interface EditEventPageProps {
  params: {
    id: string;
  };
}

export default function EditEventPage({ params }: EditEventPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      <EditEventForm eventId={params.id} />
    </div>
  );
}
