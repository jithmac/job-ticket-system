import { PrismaClient } from "@prisma/client";

type PrismaWithQueryLogging = PrismaClient<{
  log: [{ emit: "event"; level: "query" }, "error", "warn"];
}>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaWithQueryLogging;
  prismaQueryLoggingAttached?: boolean;
};

export const db: PrismaWithQueryLogging =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [{ emit: "event", level: "query" }, "error", "warn"],
  });

if (process.env.NODE_ENV !== "production" && !globalForPrisma.prismaQueryLoggingAttached) {
  db.$on("query", (event) => {
    console.log(`[db query ${event.duration}ms] ${event.query}`, event.params);
  });
  globalForPrisma.prismaQueryLoggingAttached = true;
  globalForPrisma.prisma = db;
}
