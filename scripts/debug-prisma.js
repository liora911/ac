
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPrisma() {
  console.log('🔍 Testing Prisma connection...');
  
  try {
    console.log('\n1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    console.log('\n2️⃣ Checking database tables...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table';
      `;
      console.log('📋 Available tables:', tables);
    } catch (tableError) {
      console.log('ℹ️ Could not query tables (this is normal for some setups)');
    }

    console.log('\n3️⃣ Counting users...');
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);

    console.log('\n4️⃣ Counting articles...');
    const articleCount = await prisma.article.count();
    console.log(`📰 Articles in database: ${articleCount}`);

    console.log('\n5️⃣ Testing user creation...');
    try {
      const testUser = await prisma.user.create({
        data: {
          name: 'Debug Test User',
          email: `debug-test-${Date.now()}@example.com`,
        },
      });
      console.log('✅ User created successfully:', testUser.id);
      
      console.log('\n6️⃣ Testing article creation...');
      const testArticle = await prisma.article.create({
        data: {
          title: 'Debug Test Article',
          content: 'This is a test article created by the debug script.',
          publisherName: 'Debug Script',
          authorId: testUser.id,
          published: true,
        },
      });
      console.log('✅ Article created successfully:', testArticle.id);
      
      console.log('\n7️⃣ Testing article fetch with relations...');
      const fetchedArticle = await prisma.article.findUnique({
        where: { id: testArticle.id },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      console.log('✅ Article fetched with relations:', {
        title: fetchedArticle?.title,
        author: fetchedArticle?.author,
      });
      
      console.log('\n🧹 Cleaning up test data...');
      await prisma.article.delete({ where: { id: testArticle.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
      console.log('✅ Cleanup completed');
      
    } catch (createError) {
      console.error('❌ Error during creation tests:', createError);
    }

    console.log('\n8️⃣ Listing all articles...');
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        publisherName: true,
        published: true,
        createdAt: true,
      },
      take: 5, 
    });
    console.log('📝 Articles in database:');
    if (articles.length === 0) {
      console.log('  No articles found in database');
    } else {
      articles.forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title} (${article.published ? 'Published' : 'Draft'})`);
      });
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Database connection or operation failed:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if ('code' in error) {
        console.error('Error code:', error.code);
      }
    }
  } finally {
    await prisma.$disconnect();
    console.log('👋 Disconnected from database');
  }
}

debugPrisma();