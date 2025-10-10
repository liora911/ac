// Import Prisma client with type assertion to bypass generation issues
const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

const prisma = globalForPrisma.prisma ?? new (PrismaClient as any)();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
