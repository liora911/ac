import prisma from "@/lib/prisma/prisma";
import { Category } from "@/types/Lectures/lectures";

type LectureWithAuthor = any;
type SubcategoryWithLectures = any;
type CategoryWithLectures = any;

function formatLecture(lec: LectureWithAuthor) {
  return {
    id: lec.id,
    title: lec.title,
    description: lec.description,
    videoUrl: lec.videoUrl || undefined,
    duration: lec.duration,
    date: lec.date || undefined,
    bannerImageUrl: lec.bannerImageUrl || undefined,
    author: lec.author,
  };
}

export async function fetchLectures(): Promise<Category[]> {
  if (!prisma) {
    throw new Error("Database connection not available");
  }

  const categories = await prisma.category.findMany({
    include: {
      subcategories: {
        include: {
          lectures: {
            include: {
              author: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
      lectures: {
        include: {
          author: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const formattedCategories: Category[] = categories.map(
    (cat: CategoryWithLectures) => ({
      id: cat.id,
      name: cat.name,
      bannerImageUrl: cat.bannerImageUrl || undefined,
      lectures: cat.lectures.map(formatLecture),
      subcategories: cat.subcategories.map((sub: SubcategoryWithLectures) => ({
        id: sub.id,
        name: sub.name,
        bannerImageUrl: sub.bannerImageUrl || undefined,
        lectures: sub.lectures.map(formatLecture),
        subcategories: [],
      })),
    })
  );

  return formattedCategories;
}
