// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma/prisma";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth/auth";

// export async function GET() {
//   try {
//     const articles = await prisma.article.findMany({
//       where: { published: true },
//       include: {
//         author: {
//           select: {
//             name: true,
//             email: true,
//             image: true,
//           },
//         },
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     const formattedArticles = articles.map((article: any) => ({
//       id: article.id,
//       publisherImage: article.publisherImage || "/NNZxjUl0_400x400.png",
//       publisherName: article.publisherName,
//       date: new Date(article.createdAt).toLocaleDateString("he-IL"),
//       readDuration: article.readDuration,
//       title: article.title,
//       articleImage: article.articleImage || "/consc.png",
//       content: article.content,
//     }));

//     return NextResponse.json(formattedArticles);
//   } catch (error) {
//     console.error("Error fetching articles:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch articles" },
//       { status: 500 }
//     );
//   }
// }

// // POST new article
// export async function POST(request: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { email: session.user.email },
//     });

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     const body = await request.json();
//     const {
//       title,
//       content,
//       articleImage,
//       publisherName,
//       publisherImage,
//       readDuration,
//       published = true,
//     } = body;

//     if (!title || !content) {
//       return NextResponse.json(
//         {
//           error: "Title and content are required",
//         },
//         { status: 400 }
//       );
//     }

//     const article = await prisma.article.create({
//       data: {
//         title,
//         content,
//         articleImage: articleImage || "/consc.png",
//         publisherName: publisherName || user.name || user.email || "Anonymous",
//         publisherImage: publisherImage || user.image || "/NNZxjUl0_400x400.png",
//         readDuration: readDuration || Math.ceil(content.length / 200),
//         published,
//         authorId: user.id,
//       },
//     });

//     const formattedArticle = {
//       id: article.id,
//       publisherImage: article.publisherImage,
//       publisherName: article.publisherName,
//       date: new Date(article.createdAt).toLocaleDateString("he-IL"),
//       readDuration: article.readDuration,
//       title: article.title,
//       articleImage: article.articleImage,
//       content: article.content,
//     };

//     return NextResponse.json(formattedArticle, { status: 201 });
//   } catch (error) {
//     console.error("Error creating article:", error);
//     return NextResponse.json(
//       { error: "Failed to create article" },
//       { status: 500 }
//     );
//   }
// }
// src/app/api/articles/route.ts
// Replace your existing POST function with this version:

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth/auth";

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { published: true },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedArticles = articles.map((article: any) => ({
      id: article.id,
      publisherImage: article.publisherImage || "/NNZxjUl0_400x400.png",
      publisherName: article.publisherName,
      date: new Date(article.createdAt).toLocaleDateString("he-IL"),
      readDuration: article.readDuration,
      title: article.title,
      articleImage: article.articleImage || "/consc.png",
      content: article.content,
    }));

    return NextResponse.json(formattedArticles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST new article - AUTH TEMPORARILY DISABLED FOR TESTING
export async function POST(request: NextRequest) {
  try {
    // TEMPORARILY COMMENTED OUT FOR TESTING:
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Find or create a test user
    let user = await prisma.user.findFirst();

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Test User",
          email: "test@example.com",
        },
      });
      console.log("Created test user for development");
    }

    const body = await request.json();
    const {
      title,
      content,
      articleImage,
      publisherName,
      publisherImage,
      readDuration,
      published = true,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        {
          error: "Title and content are required",
        },
        { status: 400 }
      );
    }

    const article = await prisma.article.create({
      data: {
        title,
        content,
        articleImage: articleImage || "/consc.png",
        publisherName: publisherName || user.name || "Anonymous",
        publisherImage: publisherImage || user.image || "/NNZxjUl0_400x400.png",
        readDuration: readDuration || Math.ceil(content.length / 200),
        published,
        authorId: user.id,
      },
    });

    const formattedArticle = {
      id: article.id,
      publisherImage: article.publisherImage,
      publisherName: article.publisherName,
      date: new Date(article.createdAt).toLocaleDateString("he-IL"),
      readDuration: article.readDuration,
      title: article.title,
      articleImage: article.articleImage,
      content: article.content,
    };

    return NextResponse.json(formattedArticle, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
