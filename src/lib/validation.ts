import { z } from "zod";

export const createOrderSchema = z.object({
  truckId: z.string().min(1),
  customerName: z.string().trim().min(1).max(80),
  customerPhone: z.string().trim().min(3).max(30),
  pickupNote: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
        notes: z.string().trim().max(200).optional().default(""),
        modifierOptionIds: z.array(z.string().min(1)).max(50).default([]),
      })
    )
    .min(1)
    .max(50),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"]),
});

export const truckSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(140).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  logoEmoji: z.string().trim().max(10).optional().default("🚚"),
  logoUrl: z.string().trim().url().optional().or(z.literal("")).optional(),
  coverUrl: z.string().trim().url().optional().or(z.literal("")).optional(),
  primaryColor: z.string().trim().min(1).max(20),
  secondaryColor: z.string().trim().min(1).max(20),
  accentColor: z.string().trim().min(1).max(20),
  fontFamily: z.enum(["system", "serif", "mono", "rounded"]),
  cornerStyle: z.enum(["sharp", "rounded", "pill"]),
  isOpen: z.boolean(),
  location: z.string().trim().max(200).optional().default(""),
  hoursText: z.string().trim().max(500).optional().default(""),
  estimatedWaitMinutes: z.number().int().min(0).max(240),
  taxRatePercent: z.number().min(0).max(100),
  currencySymbol: z.string().trim().min(1).max(5),
  orderPrefix: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only"),
  contactPhone: z.string().trim().max(30).optional().default(""),
  contactEmail: z.string().trim().max(100).optional().default(""),
  socialLinks: z
    .array(z.object({ label: z.string().trim().max(30), url: z.string().trim().max(300) }))
    .max(10)
    .optional()
    .default([]),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional().default(""),
  sortOrder: z.number().int().optional().default(0),
});

export const menuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().default(""),
  priceCents: z.number().int().min(0).max(10_000_00),
  imageEmoji: z.string().trim().max(10).optional().default("🍽️"),
  imageUrl: z.string().trim().url().optional().or(z.literal("")).optional(),
  isAvailable: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});

export const modifierGroupSchema = z.object({
  menuItemId: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  minSelect: z.number().int().min(0).max(20),
  maxSelect: z.number().int().min(0).max(20),
  required: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});

export const modifierOptionSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  priceDeltaCents: z.number().int().min(-10_000_00).max(10_000_00),
  isDefault: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});
