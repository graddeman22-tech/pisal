import { pgTable, serial, text, integer, boolean, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  price: real("price").notNull(),
  originalPrice: real("original_price"),
  imageUrl: text("image_url").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  inStock: boolean("in_stock").notNull().default(true),
  stockQuantity: integer("stock_quantity").notNull().default(100),
  isFeatured: boolean("is_featured").notNull().default(false),
  isBestseller: boolean("is_bestseller").notNull().default(false),
  ingredients: text("ingredients"),
  benefits: jsonb("benefits").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  weightOptions: jsonb("weight_options").$type<{weight: string; price: number; originalPrice?: number; inStock: boolean}[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
