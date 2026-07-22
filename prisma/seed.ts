import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.order.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.truck.deleteMany();

  const tacoTruck = await prisma.truck.create({
    data: {
      slug: "taco-time",
      name: "Taco Time",
      tagline: "Tacos made fresh, fast",
      description:
        "Family-owned taco truck serving the neighborhood since 2015. Everything made to order.",
      logoEmoji: "🌮",
      primaryColor: "#ea580c",
      secondaryColor: "#1c1917",
      accentColor: "#facc15",
      fontFamily: "rounded",
      cornerStyle: "pill",
      isOpen: true,
      location: "Corner of 5th & Main",
      hoursText: "Mon–Sat 11am–8pm",
      estimatedWaitMinutes: 15,
      taxRatePercent: 8.25,
      currencySymbol: "$",
      orderPrefix: "TACO",
      contactPhone: "(555) 010-2020",
      contactEmail: "hello@tacotime.example",
      socialLinks: JSON.stringify([{ label: "Instagram", url: "https://instagram.com/tacotime" }]),
      categories: {
        create: [
          {
            name: "Tacos",
            description: "Two corn tortillas, choice of filling",
            sortOrder: 0,
            items: {
              create: [
                {
                  name: "Carnitas Taco",
                  description: "Slow-braised pork, onion, cilantro",
                  priceCents: 450,
                  imageEmoji: "🌮",
                  isFeatured: true,
                  sortOrder: 0,
                  modifierGroups: {
                    create: [
                      {
                        name: "Salsa",
                        minSelect: 0,
                        maxSelect: 1,
                        sortOrder: 0,
                        options: {
                          create: [
                            { name: "Mild", isDefault: true, sortOrder: 0 },
                            { name: "Medium", sortOrder: 1 },
                            { name: "Hot", sortOrder: 2 },
                          ],
                        },
                      },
                      {
                        name: "Add-ons",
                        minSelect: 0,
                        maxSelect: 3,
                        sortOrder: 1,
                        options: {
                          create: [
                            { name: "Extra cheese", priceDeltaCents: 75, sortOrder: 0 },
                            { name: "Guacamole", priceDeltaCents: 150, sortOrder: 1 },
                            { name: "Sour cream", priceDeltaCents: 50, sortOrder: 2 },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  name: "Baja Fish Taco",
                  description: "Beer-battered cod, cabbage slaw, chipotle crema",
                  priceCents: 500,
                  imageEmoji: "🐟",
                  sortOrder: 1,
                },
                {
                  name: "Veggie Taco",
                  description: "Grilled seasonal vegetables, cotija cheese",
                  priceCents: 400,
                  imageEmoji: "🥬",
                  sortOrder: 2,
                },
              ],
            },
          },
          {
            name: "Sides & Drinks",
            sortOrder: 1,
            items: {
              create: [
                { name: "Chips & Salsa", priceCents: 350, imageEmoji: "🌶️", sortOrder: 0 },
                { name: "Horchata", priceCents: 300, imageEmoji: "🥤", sortOrder: 1 },
                { name: "Mexican Coke", priceCents: 275, imageEmoji: "🥤", sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  const burgerTruck = await prisma.truck.create({
    data: {
      slug: "grill-on-wheels",
      name: "Grill on Wheels",
      tagline: "Smash burgers & crispy fries",
      description: "Classic American smash burgers with a modern twist.",
      logoEmoji: "🍔",
      primaryColor: "#16a34a",
      secondaryColor: "#052e16",
      accentColor: "#fde047",
      fontFamily: "system",
      cornerStyle: "rounded",
      isOpen: true,
      location: "Riverside Park lot B",
      hoursText: "Tue–Sun 12pm–9pm",
      estimatedWaitMinutes: 20,
      taxRatePercent: 7,
      currencySymbol: "$",
      orderPrefix: "GRILL",
      categories: {
        create: [
          {
            name: "Burgers",
            sortOrder: 0,
            items: {
              create: [
                {
                  name: "Classic Smash Burger",
                  description: "Double patty, American cheese, house sauce",
                  priceCents: 950,
                  imageEmoji: "🍔",
                  isFeatured: true,
                  sortOrder: 0,
                  modifierGroups: {
                    create: [
                      {
                        name: "Doneness",
                        minSelect: 1,
                        maxSelect: 1,
                        required: true,
                        sortOrder: 0,
                        options: {
                          create: [
                            { name: "Medium", isDefault: true, sortOrder: 0 },
                            { name: "Well done", sortOrder: 1 },
                          ],
                        },
                      },
                      {
                        name: "Extras",
                        minSelect: 0,
                        maxSelect: 4,
                        sortOrder: 1,
                        options: {
                          create: [
                            { name: "Bacon", priceDeltaCents: 150, sortOrder: 0 },
                            { name: "Extra patty", priceDeltaCents: 300, sortOrder: 1 },
                            { name: "Fried egg", priceDeltaCents: 125, sortOrder: 2 },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  name: "Veggie Burger",
                  description: "House-made black bean patty",
                  priceCents: 850,
                  imageEmoji: "🥦",
                  sortOrder: 1,
                },
              ],
            },
          },
          {
            name: "Sides",
            sortOrder: 1,
            items: {
              create: [
                { name: "Crispy Fries", priceCents: 400, imageEmoji: "🍟", sortOrder: 0 },
                { name: "Onion Rings", priceCents: 450, imageEmoji: "🧅", sortOrder: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Seeded trucks: ${tacoTruck.name}, ${burgerTruck.name}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
