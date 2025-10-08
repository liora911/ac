const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding presentations...');

  // Get the first user from the database
  const firstUser = await prisma.user.findFirst();
  if (!firstUser) {
    throw new Error('No users found in database. Please create a user first.');
  }

  console.log(`Using user: ${firstUser.email}`);

  // Create categories if they don't exist
  const categoriesData = [
    { name: 'Quantum Physics', bannerImageUrl: '/qft.png' },
    { name: 'Relativity', bannerImageUrl: '/spacetime.png' },
    { name: 'Biology', bannerImageUrl: '/electroncloud.png' },
    { name: 'Philosophy', bannerImageUrl: '/moon.png' },
    { name: 'Test Presentations', bannerImageUrl: '/1.png' },
  ];

  const categories = [];
  for (const catData of categoriesData) {
    let category = await prisma.category.findFirst({
      where: { name: catData.name }
    });

    if (!category) {
      category = await prisma.category.create({
        data: catData
      });
      console.log(`Created category: ${category.name}`);
    } else {
      console.log(`Using existing category: ${category.name}`);
    }
    categories.push(category);
  }

  // Seed presentations
  const presentationsData = [
    {
      title: "Quantum Mechanics Insights",
      description: "An overview of foundational concepts in quantum mechanics.",
      content: "Detailed exploration of quantum mechanics principles and applications.",
      imageUrls: ["/consc.png", "/moon.png", "/qft.png"],
      categoryId: categories[0].id, // Quantum Physics
    },
    {
      title: "Exploring Relativity",
      description: "Delving into the theories of special and general relativity.",
      content: "Covered Topics - Special Relativity, General Relativity, Time Dilation, Gravitational Waves",
      imageUrls: ["/spacetime.png", "/schrodingercat.jpg"],
      categoryId: categories[1].id, // Relativity
    },
    {
      title: "Evolutionary Biology Today",
      description: "Current research and discussions in evolutionary biology.",
      content: "Latest developments and research in evolutionary biology field.",
      imageUrls: ["/electroncloud.png", "/qftt.png"],
      categoryId: categories[2].id, // Biology
    },
    {
      title: "Philosophy of Mind",
      description: "Exploring consciousness and the nature of mind.",
      content: "Philosophical exploration of consciousness and mental phenomena.",
      imageUrls: ["/moon.png"],
      categoryId: categories[3].id, // Philosophy
    },
    {
      title: "Yarin Test Presentation",
      description: "Testing Presentations, long paragraph to check text overflow and layout. This is a long description to ensure that the text wraps correctly and does not overflow the card. It should be long enough to test the layout effectively.",
      content: "Test presentation content for layout verification.",
      imageUrls: ["/1.png", "/2.png", "/3.png", "/4.png"],
      categoryId: categories[4].id, // Test Presentations
    },
  ];

  for (const presentationData of presentationsData) {
    const existingPresentation = await prisma.presentation.findFirst({
      where: { title: presentationData.title }
    });

    if (!existingPresentation) {
      const presentation = await prisma.presentation.create({
        data: {
          ...presentationData,
          authorId: firstUser.id,
        }
      });
      console.log(`Created presentation: ${presentation.title}`);
    } else {
      console.log(`Presentation already exists: ${presentationData.title}`);
    }
  }

  console.log('Presentations seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });