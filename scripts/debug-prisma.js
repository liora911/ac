// scripts/debug-prisma.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPrisma() {
  console.log('🔍 Testing Prisma connection...');
  
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test 2: Check if tables exist
    console.log('\n2️⃣ Checking database tables...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table';
      `;
      console.log('📋 Available tables:', tables);
    } catch (tableError) {
      console.log('ℹ️ Could not query tables (this is normal for some setups)');
    }

    // Test 3: Count users
    console.log('\n3️⃣ Counting users...');
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);

    // Test 4: Count articles
    console.log('\n4️⃣ Counting articles...');
    const articleCount = await prisma.article.count();
    console.log(`📰 Articles in database: ${articleCount}`);

    // Test 5: Try to create a test user
    console.log('\n5️⃣ Testing user creation...');
    try {
      const testUser = await prisma.user.create({
        data: {
          name: 'Debug Test User',
          email: `debug-test-${Date.now()}@example.com`,
        },
      });
      console.log('✅ User created successfully:', testUser.id);
      
      // Test 6: Try to create a test article
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
      
      // Test 7: Try to fetch the article with relations
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
      
      // Cleanup test data
      console.log('\n🧹 Cleaning up test data...');
      await prisma.article.delete({ where: { id: testArticle.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
      console.log('✅ Cleanup completed');
      
    } catch (createError) {
      console.error('❌ Error during creation tests:', createError);
    }

    // Test 8: List all articles
    console.log('\n8️⃣ Listing all articles...');
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        publisherName: true,
        published: true,
        createdAt: true,
      },
      take: 5, // Limit to first 5
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
    
    // Additional error information
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