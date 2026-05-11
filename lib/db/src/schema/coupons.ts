import { pgTable, serial, text, real, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(),
  discountValue: real("discount_value").notNull(),
  minOrderValue: real("min_order_value").default(0),
  maxDiscount: real("max_discount"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  usageCount: integer("usage_count").notNull().default(0),
  usageLimit: integer("usage_limit"),
});

export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, usageCount: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof couponsTable.$inferSelect;
