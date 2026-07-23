import { prisma } from "../lib/prisma.js";

async function main() {
  try {
    const row = await prisma.user.findFirst({
      select: { id: true, email: true },
    });

    if (!row) {
      console.log("✅ Connected.");
      return;
    }

    console.log("✅ Connected.");
  } catch (error) {
    console.error("❌ Prisma verification failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
