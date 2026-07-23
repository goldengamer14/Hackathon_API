import { prisma } from "../lib/prisma.js";

async function main() {
  await prisma.user.createMany({
    data: [
      { email: "alice@example.com", name: "Alice" },
      { email: "bob@example.com", name: "Bob" },
    ],
    skipDuplicates: true,
  });

  const alice = await prisma.user.findUnique({ where: { email: "alice@example.com" } });
  const bob = await prisma.user.findUnique({ where: { email: "bob@example.com" } });

  if (!alice || !bob) {
    throw new Error("Seed users were not created as expected.");
  }

  await prisma.post.createMany({
    data: [
      { title: "Hello from Prisma", content: "This is the first seed post.", published: true, authorId: alice.id },
      { title: "A second draft", content: "A draft post for the starter schema.", published: false, authorId: bob.id },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
