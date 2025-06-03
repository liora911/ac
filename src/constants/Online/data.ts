import { OnlineEventMonthGroup } from "@/types/Online/online";

export const onlineEventsData: OnlineEventMonthGroup[] = [
  {
    monthYear: "אפריל 2025",
    events: [
      {
        id: "onlineEvt1",
        day: "Tuesday",
        date: 15,
        time: "19:00",
        title: "מבוא לתורת הקוונטים",
        platform: "Zoom",
        status: "Register",
        eventLink: "#",
      },
      {
        id: "onlineEvt2",
        day: "Thursday",
        date: 24,
        time: "20:30",
        title: "דיון פתוח: תודעה וחומר",
        platform: "Zoom",
        status: "Sold Out",
      },
    ],
  },
  {
    monthYear: "מאי 2025",
    events: [
      {
        id: "onlineEvt3",
        day: "Monday",
        date: 5,
        time: "18:00",
        title: "סדנת כתיבה מדעית ",
        platform: "Zoom",
        status: "Join Link",
        eventLink: "#", // Placeholder for join link (could be revealed closer to time)
      },
    ],
  },
];
