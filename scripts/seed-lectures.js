const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  {
    id: "cat1",
    name: "פיזיקה קוונטית",
    bannerImageUrl: "/electroncloud.png",
    lectures: [
      {
        title: "מבוא לתורת הקוונטים",
        description: "הסבר יסודי על עקרונות.",
        duration: "60 דקות",
        videoUrl: "https://www.youtube.com/embed/SOOn_vEFKaY",
        bannerImageUrl: "/spacetime.png",
      },
      {
        title: "שזירות קוונטית",
        description: "חקירת תופעת השזירות והשלכותיה.",
        duration: "75 דקות",
        videoUrl: "https://www.youtube.com/embed/oPGThRzxxuA",
      },
      {
        title: "דיאגרמות פיינמן",
        description: "הבנת דיאגרמות פיינמן וכיצד הן משמשות בתורת השדות הקוונטית.",
        duration: "15 דקות",
        videoUrl: "https://www.youtube.com/embed/X-FEU4mQWtE?si=LjutW8IlJZREK4lS",
      },
    ],
    subcategories: [
      {
        id: "subcat1-1",
        name: "פרדוקסים קוונטיים",
        bannerImageUrl: "/qftt.png",
        lectures: [
          {
            title: "החתול של שרדינגר",
            description: "ניתוח מעמיק של הפרדוקס המפורסם.",
            duration: "45 דקות",
            videoUrl: "https://www.youtube.com/embed/9gQys9UiQh0?si=bhwA8ehPtmDSnGcC",
            date: "2023-05-10",
            bannerImageUrl: "/schrodingercat.jpg",
          },
        ],
      },
    ],
  },
  {
    id: "cat2",
    name: "פילוסופיה של המדע",
    bannerImageUrl: "/earth.jpg",
    lectures: [
      {
        title: "מהי תיאוריה מדעית?",
        description: "דיון על הקריטריונים לתיאוריה מדעית טובה.",
        duration: "50 דקות",
        videoUrl: "https://www.youtube.com/embed/iTHUUjTA-LI?si=GrNPs9hpLlUDKDon",
      },
    ],
  },
  // Add more as needed
];

async function seedLectures() {
  console.log('🌱 Seeding lectures database...');

  try {
    const existingCategories = await prisma.category.count();
    if (existingCategories > 0) {
      console.log(`📋 Database already has ${existingCategories} categories. Skipping seed.`);
      return;
    }

    let user = await prisma.user.upsert({
      where: { email: 'admin@elitzur.com' },
      update: {},
      create: {
        name: 'אבשלום אליצור',
        email: 'admin@elitzur.com',
      },
    });

    console.log('✅ User ready:', user.email);

    for (const catData of categories) {
      const category = await prisma.category.create({
        data: {
          id: catData.id,
          name: catData.name,
          bannerImageUrl: catData.bannerImageUrl,
        },
      });

      console.log(`✅ Category created: "${category.name}"`);

      for (const lecData of catData.lectures) {
        await prisma.lecture.create({
          data: {
            title: lecData.title,
            description: lecData.description,
            videoUrl: lecData.videoUrl,
            duration: lecData.duration,
            date: lecData.date,
            bannerImageUrl: lecData.bannerImageUrl,
            categoryId: category.id,
            authorId: user.id,
          },
        });
        console.log(`✅ Lecture created: "${lecData.title}"`);
      }

      if (catData.subcategories) {
        for (const subData of catData.subcategories) {
          const subcategory = await prisma.category.create({
            data: {
              id: subData.id,
              name: subData.name,
              bannerImageUrl: subData.bannerImageUrl,
              parentId: category.id,
            },
          });

          console.log(`✅ Subcategory created: "${subcategory.name}"`);

          for (const lecData of subData.lectures) {
            await prisma.lecture.create({
              data: {
                title: lecData.title,
                description: lecData.description,
                videoUrl: lecData.videoUrl,
                duration: lecData.duration,
                date: lecData.date,
                bannerImageUrl: lecData.bannerImageUrl,
                categoryId: subcategory.id,
                authorId: user.id,
              },
            });
            console.log(`✅ Lecture created: "${lecData.title}"`);
          }
        }
      }
    }

    console.log('🎉 Lectures seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedLectures();