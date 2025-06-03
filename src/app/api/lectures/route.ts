import { Category } from "@/types/Lectures/lectures";
import { NextResponse } from "next/server";

const lectureData: Category[] = [
  {
    id: "cat1",
    name: "פיזיקה קוונטית",
    bannerImageUrl: "/electroncloud.png",
    lectures: [
      {
        id: "l1-api",
        title: "מבוא לתורת הקוונטים",
        description: "הסבר יסודי על עקרונות.",
        duration: "60 דקות",
        videoUrl: "https://www.youtube.com/embed/SOOn_vEFKaY",
        bannerImageUrl: "/spacetime.png",
      },
      {
        id: "l2-api",
        title: "שזירות קוונטית",
        description: "חקירת תופעת השזירות והשלכותיה.",
        duration: "75 דקות",
        videoUrl: "https://www.youtube.com/embed/oPGThRzxxuA",
      },
      {
        id: "l3-api",
        title: "דיאגרמות פיינמן",
        description:
          "הבנת דיאגרמות פיינמן וכיצד הן משמשות בתורת השדות הקוונטית.",
        duration: "15 דקות",
        videoUrl:
          "https://www.youtube.com/embed/X-FEU4mQWtE?si=LjutW8IlJZREK4lS",
      },
    ],
    subcategories: [
      {
        id: "subcat1-1-api",
        name: "פרדוקסים קוונטיים",
        bannerImageUrl: "/qftt.png",
        lectures: [
          {
            id: "l3-api",
            title: "החתול של שרדינגר",
            description: "ניתוח מעמיק של הפרדוקס המפורסם.",
            duration: "45 דקות",
            videoUrl:
              "https://www.youtube.com/embed/9gQys9UiQh0?si=bhwA8ehPtmDSnGcC",
            date: "2023-05-10",
            bannerImageUrl: "/schrodingercat.jpg",
          },
        ],
      },
    ],
  },
  {
    id: "cat2 ",
    name: "פילוסופיה של המדע",
    bannerImageUrl: "/earth.jpg",
    lectures: [
      {
        id: "l4",
        title: "מהי תיאוריה מדעית?",
        description:
          " דיון על הקריטריונים לתיאוריה מדעית טובה. דיון על הקריטריונים לתיאוריה מדעית טובה.דיון על הקריטריונים לתיאוריה מדעית טובה.דיון על הקריטריונים לתיאוריה מדעית טובה.דיון על הקריטריונים לתיאוריה מדעית טובה.דיון על הקריטריונים לתיאוריה מדעית טובה.דיון על הקריטריונים לתיאוריה מדעית טובה.",
        duration: "50 דקות",
        videoUrl:
          "https://www.youtube.com/embed/iTHUUjTA-LI?si=GrNPs9hpLlUDKDon",
      },
    ],
  },
  {
    id: "cat3",
    name: "אסטרונומיה",
    bannerImageUrl: "/milkyway.jpg",
    lectures: [
      {
        id: "l5",
        title: "מבוא לאסטרונומיה",
        description: "הבנת היקום, כוכבים וגלקסיות.",
        duration: "40 דקות",
        videoUrl:
          "https://www.youtube.com/embed/1b6d8a2c7e4?si=9gQys9UiQh0?si=bhwA8ehPtmDSnGcC",
      },
    ],
  },
  {
    id: "cat4",
    name: "ירין טסטים למערכת",
    bannerImageUrl: "/blackhole.jpg",
    lectures: [
      {
        id: "l6",
        title: "No Time for Caution",
        description: "ירין בדיקה",
        duration: "5 דקות",
        videoUrl:
          "https://www.youtube.com/embed/m3zvVGJrTP8?si=5BZ1bJ-zLNeaDFTO",
      },
      {
        id: "l7",
        title: "Cornfield Chase Extended",
        description: "Cornfield Chase",
        duration: "30 דקות",
        videoUrl:
          "https://www.youtube.com/embed/uCSkC3NupQc?si=I66HFlVBPdj5Ddjh",
      },
    ],
    subcategories: [
      {
        id: "subcat4-1",
        name: "קטגוריה משנה לירין",
        bannerImageUrl: "/blackhole.jpg",
        lectures: [
          {
            id: "l8",
            title: "בדיקת ירין נוספת",
            description: "תיאור בדיקה נוספת של ירין",
            duration: "10 דקות",
          },
        ],
      },
    ],
  },
];

export async function GET() {
  // In a real application, you would fetch data from your external API here:
  // try {
  //   const response = await fetch('YOUR_EXTERNAL_API_ENDPOINT/lectures');
  //   if (!response.ok) {
  //     throw new Error(`Failed to fetch lectures: ${response.statusText}`);
  //   }
  //   const data = await response.json();
  //   return NextResponse.json(data);
  // } catch (error) {
  //   console.error("Error fetching lectures:", error);
  //   return NextResponse.json({ error: 'Failed to fetch lecture data' }, { status: 500 });
  // }

  // For now, we return the hardcoded sample data
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
  return NextResponse.json(lectureData);
}
