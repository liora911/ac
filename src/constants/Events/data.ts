import { EventMonthGroup } from "@/types/Events/events";

export const eventsData: EventMonthGroup[] = [
  {
    monthYear: "אפריל 2025",
    events: [
      {
        id: "evt1",
        day: "רביעי",
        date: 23,
        time: "20:00",
        location: "Tel-Aviv, Israel",
        venue: "Kaufman Hall",
        status: "Buy Tickets",
        ticketLink: "#",
      },
      {
        id: "evt2",
        day: "ראשון",
        date: 26,
        time: "19:30",
        location: "Jerusalem, Israel",
        venue: "Binyenei HaUma",
        status: "Sold Out",
      },
    ],
  },
  {
    monthYear: "מאי 2025",
    events: [
      {
        id: "evt3",
        day: "חמישי",
        date: 15,
        time: "21:00",
        location: "Haifa, Israel",
        venue: "Haifa Auditorium",
        status: "Buy Tickets",
        ticketLink: "#",
      },
    ],
  },
  {
    monthYear: "יוני 2025",
    events: [
      {
        id: "evt4",
        day: "שני",
        date: 2,
        time: "18:00",
        location: "Beersheba, Israel",
        venue: "Performing Arts Center",
        status: "Buy Tickets",
        ticketLink: "#",
      },
      {
        id: "evt5",
        day: "שישי",
        date: 20,
        time: "20:30",
        location: "Tel-Aviv, Israel",
        venue: "Heichal HaTarbut",
        status: "Sold Out",
      },
    ],
  },
];
