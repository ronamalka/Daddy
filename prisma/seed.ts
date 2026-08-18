import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const directUrl = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const adapter = new PrismaPg({ connectionString: directUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = [
    { name: "Graphics & Design", slug: "graphics-design" },
    { name: "Programming & Tech", slug: "programming-tech" },
    { name: "Digital Marketing", slug: "digital-marketing" },
    { name: "Video & Animation", slug: "video-animation" },
    { name: "Writing & Translation", slug: "writing-translation" },
    { name: "Music & Audio", slug: "music-audio" },
    { name: "Business", slug: "business" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const passwordHash = await hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@daddy.com" },
    update: {},
    create: { name: "Admin", email: "admin@daddy.com", passwordHash, role: "ADMIN" },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@daddy.com" },
    update: {},
    create: { name: "Jane Designer", email: "seller@daddy.com", passwordHash, role: "SELLER", bio: "Professional designer with 5+ years of experience" },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@daddy.com" },
    update: {},
    create: { name: "John Client", email: "buyer@daddy.com", passwordHash, role: "BUYER" },
  });

  const graphicsCategory = await prisma.category.findUnique({ where: { slug: "graphics-design" } });
  const techCategory = await prisma.category.findUnique({ where: { slug: "programming-tech" } });

  if (graphicsCategory) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-1" },
      update: {},
      create: {
        id: "seed-gig-1",
        title: "I will design a professional logo for your brand",
        description: "Get a unique, high-quality logo designed for your business. I specialize in minimalist, modern, and vintage logo designs. You will receive multiple concepts and unlimited revisions until you are 100% satisfied.",
        categoryId: graphicsCategory.id,
        sellerId: seller.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "Basic Logo", description: "1 concept, PNG file", price: 25, deliveryDays: 3, revisions: 2 },
            { tier: "STANDARD", title: "Standard Logo", description: "3 concepts, PNG + SVG", price: 50, deliveryDays: 2, revisions: 5 },
            { tier: "PREMIUM", title: "Premium Logo", description: "5 concepts, all formats + brand guide", price: 100, deliveryDays: 1, revisions: 99 },
          ],
        },
      },
    });
  }

  if (techCategory) {
    await prisma.gig.upsert({
      where: { id: "seed-gig-2" },
      update: {},
      create: {
        id: "seed-gig-2",
        title: "I will build a responsive website using React and Next.js",
        description: "Full-stack web development services. I build modern, fast, and responsive websites using the latest technologies including React, Next.js, and Tailwind CSS.",
        categoryId: techCategory.id,
        sellerId: seller.id,
        tiers: {
          create: [
            { tier: "BASIC", title: "Landing Page", description: "Single page, responsive design", price: 100, deliveryDays: 5, revisions: 2 },
            { tier: "STANDARD", title: "Multi-Page Site", description: "Up to 5 pages, responsive + SEO", price: 300, deliveryDays: 7, revisions: 3 },
            { tier: "PREMIUM", title: "Full Web App", description: "Full-stack app with auth + database", price: 800, deliveryDays: 14, revisions: 5 },
          ],
        },
      },
    });
  }

  console.log("Seed complete:", { admin: admin.email, seller: seller.email, buyer: buyer.email });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
