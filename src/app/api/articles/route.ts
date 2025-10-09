import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    // Get all valid category IDs to filter out articles with invalid categories
    const validCategoryIds = await prisma.category
      .findMany({
        select: { id: true },
      })
      .then((categories) => categories.map((cat) => cat.id));

    const whereClause: any = {
      published: true,
      ...(categoryId
        ? { categoryId }
        : {
            OR: [
              { categoryId: null },
              { categoryId: { in: validCategoryIds } },
            ],
          }),
    };

    const articles = await prisma.article.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          include: {
            parent: true,
          },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    // If no categoryId specified, group by category
    if (!categoryId) {
      const categoriesMap = new Map();

      articles.forEach((article: any) => {
        let rootCategory;
        let categoryId;
        if (!article.category) {
          // Default category for articles without category
          categoryId = "no-category";
          rootCategory = {
            id: categoryId,
            name: "ללא קטגוריה",
            bannerImageUrl: null,
          };
        } else {
          rootCategory = article.category.parent || article.category;
          categoryId = rootCategory.id;
        }
        if (!categoriesMap.has(categoryId)) {
          categoriesMap.set(categoryId, {
            id: rootCategory.id,
            name: rootCategory.name,
            bannerImageUrl: rootCategory.bannerImageUrl,
            articles: [],
          });
        }
        categoriesMap.get(categoryId).articles.push({
          id: article.id,
          publisherImage: article.publisherImage || "/NNZxjUl0_400x400.png",
          publisherName: article.publisherName,
          date: new Date(article.createdAt).toLocaleDateString("he-IL"),
          readDuration: article.readDuration,
          title: article.title,
          articleImage: article.articleImage || "/consc.png",
          content: article.content,
        });
      });

      return NextResponse.json(Array.from(categoriesMap.values()));
    }

    // If categoryId specified, return articles for that category
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized =
      session.user.email &&
      ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized to create articles" },
        { status: 403 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: session.user.name || "Anonymous",
          email: session.user.email!,
          image: session.user.image,
        },
      });
    }

    const body = await request.json();
    const {
      title,
      content,
      articleImage,
      publisherName,
      publisherImage,
      readDuration,
      categoryId,
      published = true,
    } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        {
          error: "Title, content, and categoryId are required",
        },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
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
        categoryId,
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
