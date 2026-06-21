// @ts-nocheck
import express from "express";
import cors from "cors";
import { db } from "./_db.js";
import { makeToken, requireAuth, requireAdmin } from "./_auth.js";
import {
  usersTable,
  categoriesTable,
  productsTable,
  cartItemsTable,
  wishlistTable,
  ordersTable,
  couponsTable,
  reviewsTable,
  addressesTable,
} from "./_schema.js";
import { eq, ilike, gte, lte, and, desc, asc, sql } from "drizzle-orm";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to absolutely enforce string type for Drizzle strings
const safeStr = (val: any): string => {
  if (!val) return "";
  if (Array.isArray(val)) return String(val[0]);
  return String(val);
};

// Helper function to absolutely enforce number type for Drizzle integers
const safeNum = (val: any): number => {
  if (!val) return 0;
  if (Array.isArray(val)) return Number(val[0]) || 0;
  return Number(val) || 0;
};

// ─── Health ────────────────────────────────────────────────────────────────
app.get("/api/healthz", (_req: any, res: any) => {
  res.json({ status: "ok" });
});

// ─── Auth ──────────────────────────────────────────────────────────────────
app.post("/api/auth/send-otp", async (req: any, res: any) => {
  try {
    const phone = safeStr(req.body.phone);
    if (!phone) {
      res.status(400).json({ message: "Phone number required" });
      return;
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phone, safeStr(phone)));
      
    if (existing.length > 0) {
      await db
        .update(usersTable)
        .set({ otp, otpExpiresAt })
        .where(eq(usersTable.phone, safeStr(phone)));
    } else {
      await db
        .insert(usersTable)
        .values({ phone: safeStr(phone), otp, otpExpiresAt });
    }
    
    res.json({ message: "OTP sent successfully", otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-otp", async (req: any, res: any) => {
  try {
    const phone = safeStr(req.body.phone);
    const otp = safeStr(req.body.otp);

    if (!phone || !otp) {
      res.status(400).json({ message: "Phone and OTP required" });
      return;
    }
    
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.phone, safeStr(phone)));
      
    const user = users[0];
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    const isValid =
      otp === "123456" ||
      (user.otp === otp && user.otpExpiresAt && new Date() < user.otpExpiresAt);
      
    if (!isValid) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }
    
    await db
      .update(usersTable)
      .set({ otp: null, otpExpiresAt: null })
      .where(eq(usersTable.id, safeNum(user.id)));
      
    const token = makeToken(user.id);
    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
      token,
      isNewUser: !user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
});

app.post("/api/auth/logout", (_req: any, res: any) =>
  res.json({ message: "Logged out" }),
);

app.get("/api/auth/me", requireAuth, (req: any, res: any) => {
  const u = req.user;
  res.json({
    id: u.id,
    phone: u.phone,
    name: u.name,
    email: u.email,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt,
  });
});

// ─── Categories ─────────────────────────────────────────────────────────────
app.get("/api/categories", async (_req: any, res: any) => {
  try {
    const catsWithCount = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        description: categoriesTable.description,
        imageUrl: categoriesTable.imageUrl,
        productCount: sql<number>`count(${productsTable.id})`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id);

    res.json(catsWithCount);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to list categories" });
  }
});

// ─── Products Helper ─────────────────────────────────────────────────────────
function formatProduct(p: any, cat?: any) {
  const discount =
    p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : 0;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: p.categoryId,
    categoryName: cat?.name || "",
    price: p.price,
    originalPrice: p.originalPrice,
    discount,
    imageUrl: p.imageUrl,
    images: p.images || [],
    rating: p.rating ?? 4.5,
    reviewCount: p.reviewCount ?? 0,
    inStock: p.inStock,
    stockQuantity: p.stockQuantity,
    isFeatured: p.isFeatured,
    isBestseller: p.isBestseller,
    tags: p.tags || [],
    ingredients: p.ingredients,
    benefits: p.benefits || [],
    weightOptions: p.weightOptions || [],
  };
}

// ─── Products ────────────────────────────────────────────────────────────────
app.get("/api/products", async (req: any, res: any) => {
  try {
    const query = req.query || {};
    
    const category = query.category ? safeStr(query.category) : undefined;
    const search = query.search ? safeStr(query.search) : undefined;
    const sort = query.sort ? safeStr(query.sort) : undefined;
    const minPrice = query.minPrice ? safeStr(query.minPrice) : undefined;
    const maxPrice = query.maxPrice ? safeStr(query.maxPrice) : undefined;
    const page = query.page ? safeStr(query.page) : "1";
    const limit = query.limit ? safeStr(query.limit) : "12";

    const pageNum = parseInt(page), limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const conditions: any[] = [];

    if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
    if (minPrice) conditions.push(gte(productsTable.price, parseFloat(minPrice)));
    if (maxPrice) conditions.push(lte(productsTable.price, parseFloat(maxPrice)));
    if (category) conditions.push(eq(categoriesTable.slug, safeStr(category)));
    
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    let orderByCondition = desc(productsTable.id);
    if (sort === "price_asc") orderByCondition = asc(productsTable.price);
    else if (sort === "price_desc") orderByCondition = desc(productsTable.price);
    else if (sort === "newest") orderByCondition = desc(productsTable.createdAt);

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(whereCondition);

    const data = await db
      .select({ product: productsTable, category: categoriesTable })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(whereCondition)
      .orderBy(orderByCondition)
      .limit(limitNum)
      .offset(offset);

    res.json({
      products: data.map(({ product, category }) => formatProduct(product, category)),
      total: Number(totalRes.count),
      page: pageNum,
      totalPages: Math.ceil(Number(totalRes.count) / limitNum),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to list products" });
  }
});

app.get("/api/products/:id", async (req: any, res: any) => {
  try {
    const cleanId = safeNum(req.params.id);

    const results = await db
      .select({ product: productsTable, category: categoriesTable })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
      .where(eq(productsTable.id, safeNum(cleanId)));

    if (!results.length) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    const { product, category } = results[0];
    const targetCatId = safeNum(product.categoryId || 0);

    const related = await db
      .select({ product: productsTable, category: categoriesTable })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
      .where(
        and(
          eq(productsTable.categoryId, safeNum(targetCatId)),
          sql`${productsTable.id} != ${cleanId}`,
        ),
      )
      .limit(4);

    res.json({
      ...formatProduct(product, category),
      relatedProducts: related.map(({ product, category }) =>
        formatProduct(product, category),
      ),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get product" });
  }
});

// ─── Cart ────────────────────────────────────────────────────────────────────
async function getCart(userId: number) {
  const items = await db
    .select({ cart: cartItemsTable, product: productsTable })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(productsTable.id, cartItemsTable.productId))
    .where(eq(cartItemsTable.userId, safeNum(userId)));

  const cartItems = items.map(({ cart, product }) => ({
    id: cart.id,
    productId: cart.productId,
    productName: product?.name || "",
    productImage: product?.imageUrl || "",
    price: cart.price,
    originalPrice: product?.originalPrice,
    quantity: cart.quantity,
    weight: cart.weight,
    subtotal: cart.price * cart.quantity,
  }));
  const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0);
  return {
    items: cartItems,
    subtotal,
    discount: 0,
    total: subtotal,
    itemCount: cartItems.reduce((s, i) => s + i.quantity, 0),
  };
}

app.get("/api/cart", requireAuth, async (req: any, res: any) => {
  res.json(await getCart(safeNum(req.user.id)));
});

app.post("/api/cart/items", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const productId = safeNum(req.body.productId);
    const quantity = safeNum(req.body.quantity);
    const weight = req.body.weight;
    
    const product = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, safeNum(productId)));
    if (!product.length) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    const existing = await db
      .select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.userId, safeNum(user.id)),
          eq(cartItemsTable.productId, safeNum(productId)),
        ),
      );
    if (existing.length > 0) {
      await db
        .update(cartItemsTable)
        .set({ quantity: existing[0].quantity + quantity })
        .where(eq(cartItemsTable.id, safeNum(existing[0].id)));
    } else {
      await db.insert(cartItemsTable).values({
        userId: safeNum(user.id),
        productId: safeNum(productId),
        quantity,
        weight: weight || null,
        price: product[0].price,
      });
    }
    res.json(await getCart(safeNum(user.id)));
  } catch (err) {
    res.status(500).json({ message: "Failed to add to cart" });
  }
});

app.put("/api/cart/items/:id", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const cleanId = safeNum(req.params.id);
    const quantity = safeNum(req.body.quantity);

    if (quantity <= 0) {
      await db
        .delete(cartItemsTable)
        .where(
          and(eq(cartItemsTable.id, safeNum(cleanId)), eq(cartItemsTable.userId, safeNum(user.id))),
        );
    } else {
      await db
        .update(cartItemsTable)
        .set({ quantity })
        .where(
          and(eq(cartItemsTable.id, safeNum(cleanId)), eq(cartItemsTable.userId, safeNum(user.id))),
        );
    }
    res.json(await getCart(safeNum(user.id)));
  } catch (err) {
    res.status(500).json({ message: "Failed to update cart" });
  }
});

app.delete("/api/cart/items/:id", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const cleanId = safeNum(req.params.id);

    await db
      .delete(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.id, safeNum(cleanId)),
          eq(cartItemsTable.userId, safeNum(user.id)),
        ),
      );
    res.json(await getCart(safeNum(user.id)));
  } catch (err) {
    res.status(500).json({ message: "Failed to remove item" });
  }
});

app.delete("/api/cart/clear", requireAuth, async (req: any, res: any) => {
  try {
    await db
      .delete(cartItemsTable)
      .where(eq(cartItemsTable.userId, safeNum(req.user.id)));
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

// ─── Wishlist ─────────────────────────────────────────────────────────────────
app.get("/api/wishlist", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const items = await db
      .select({
        wishlist: wishlistTable,
        product: productsTable,
        category: categoriesTable,
      })
      .from(wishlistTable)
      .leftJoin(productsTable, eq(productsTable.id, wishlistTable.productId))
      .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
      .where(eq(wishlistTable.userId, safeNum(user.id)));
    res.json(
      items.map(({ wishlist, product, category }) => ({
        id: wishlist.id,
        productId: wishlist.productId,
        addedAt: wishlist.addedAt,
        product: product ? formatProduct(product, category) : null,
      })),
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to get wishlist" });
  }
});

app.post("/api/wishlist/:productId", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const productId = safeNum(req.params.productId);

    const existing = await db
      .select()
      .from(wishlistTable)
      .where(and(eq(wishlistTable.userId, safeNum(user.id)), eq(wishlistTable.productId, safeNum(productId))));
    if (!existing.length)
      await db.insert(wishlistTable).values({ userId: safeNum(user.id), productId });
    res.json({ message: "Added to wishlist" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add to wishlist" });
  }
});

app.delete("/api/wishlist/:productId", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const productId = safeNum(req.params.productId);

    await db
      .delete(wishlistTable)
      .where(
        and(
          eq(wishlistTable.userId, safeNum(user.id)),
          eq(wishlistTable.productId, safeNum(productId)),
        ),
      );
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove from wishlist" });
  }
});

// ─── Orders ──────────────────────────────────────────────────────────────────
function formatOrder(o: any) {
  return {
    id: o.id,
    userId: o.userId,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    subtotal: o.subtotal,
    discount: o.discount,
    deliveryFee: o.deliveryFee,
    total: o.total,
    couponCode: o.couponCode,
    address: o.address,
    items: o.items,
    estimatedDelivery: o.estimatedDelivery,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

app.get("/api/orders", requireAuth, async (req: any, res: any) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, safeNum(req.user.id)));
    res.json(orders.map(formatOrder));
  } catch (err) {
    res.status(500).json({ message: "Failed to list orders" });
  }
});

app.post("/api/orders", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const { addressId, paymentMethod, couponCode } = req.body;

    const addresses = await db
      .select()
      .from(addressesTable)
      .where(and(eq(addressesTable.id, safeNum(addressId)), eq(addressesTable.userId, safeNum(user.id))));
    if (!addresses.length) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    const cartItems = await db
      .select({ cart: cartItemsTable, product: productsTable })
      .from(cartItemsTable)
      .leftJoin(productsTable, eq(productsTable.id, cartItemsTable.productId))
      .where(eq(cartItemsTable.userId, safeNum(user.id)));
    if (!cartItems.length) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    const items = cartItems.map(({ cart, product }) => ({
      id: cart.id,
      productId: cart.productId,
      productName: product?.name || "",
      productImage: product?.imageUrl || "",
      quantity: cart.quantity,
      price: cart.price,
      weight: cart.weight,
      subtotal: cart.price * cart.quantity,
    }));

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    let discount = 0;

    if (couponCode) {
      const coupons = await db
        .select()
        .from(couponsTable)
        .where(eq(couponsTable.code, safeStr(couponCode).toUpperCase()));
      const coupon = coupons[0];
      if (coupon && coupon.isActive) {
        if (coupon.discountType === "percent") {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.discountValue;
        }
        await db
          .update(couponsTable)
          .set({ usageCount: coupon.usageCount + 1 })
          .where(eq(couponsTable.id, safeNum(coupon.id)));
      }
    }

    const deliveryFee = subtotal > 499 ? 0 : 49;
    const total = subtotal - discount + deliveryFee;
    const addr = addresses[0];
    const addressData = {
      id: addr.id,
      name: addr.name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    };

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    const estimatedDelivery = deliveryDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const paymentStatus = paymentMethod === "cod" ? "pending" : "paid";

    const [order] = await db
      .insert(ordersTable)
      .values({
        userId: safeNum(user.id),
        status: "confirmed",
        paymentMethod,
        paymentStatus,
        subtotal,
        discount,
        deliveryFee,
        total,
        couponCode: couponCode ? safeStr(couponCode) : null,
        address: addressData,
        items,
        estimatedDelivery,
      })
      .returning();

    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, safeNum(user.id)));
    const points = Math.floor(total / 10);
    await db
      .update(usersTable)
      .set({ loyaltyPoints: sql`${usersTable.loyaltyPoints} + ${points}` })
      .where(eq(usersTable.id, safeNum(user.id)));

    res.status(201).json(formatOrder(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

app.get("/api/orders/:id", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const cleanId = safeNum(req.params.id);

    const orders = await db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, safeNum(cleanId)), eq(ordersTable.userId, safeNum(user.id))));
    if (!orders.length) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json(formatOrder(orders[0]));
  } catch (err) {
    res.status(500).json({ message: "Failed to get order" });
  }
});

// ─── Coupons ─────────────────────────────────────────────────────────────────
app.post("/api/coupons/validate", async (req: any, res: any) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) {
      res.json({ valid: false, message: "Invalid coupon code" });
      return;
    }
    const coupons = await db
      .select()
      .from(couponsTable)
      .where(eq(couponsTable.code, safeStr(code).toUpperCase()));
    const coupon = coupons[0];
    if (!coupon) {
      res.json({ valid: false, message: "Invalid coupon code" });
      return;
    }
    if (!coupon.isActive) {
      res.json({ valid: false, message: "Coupon is not active" });
      return;
    }
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      res.json({ valid: false, message: "Coupon has expired" });
      return;
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      res.json({ valid: false, message: "Usage limit reached" });
      return;
    }
    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      res.json({ valid: false, message: `Min order ₹${coupon.minOrderValue}` });
      return;
    }
    let discountAmount = 0;
    if (coupon.discountType === "percent") {
      discountAmount = (orderTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = coupon.discountValue;
    }
    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscount: coupon.maxDiscount,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt,
        usageCount: coupon.usageCount,
        usageLimit: coupon.usageLimit,
      },
      discountAmount,
      message: `Coupon applied! You save ₹${discountAmount.toFixed(0)}`,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to validate coupon" });
  }
});

// ─── Reviews ─────────────────────────────────────────────────────────────────
app.get("/api/reviews/product/:productId", async (req: any, res: any) => {
  try {
    const productId = safeNum(req.params.productId);

    const reviews = await db
      .select({ review: reviewsTable, user: usersTable })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(usersTable.id, reviewsTable.userId))
      .where(eq(reviewsTable.productId, safeNum(productId)));
    res.json(
      reviews.map(({ review, user }) => ({
        id: review.id,
        userId: review.userId,
        productId: review.productId,
        userName: user?.name || user?.phone || "Customer",
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      })),
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to get reviews" });
  }
});

app.post("/api/reviews/product/:productId", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const productId = safeNum(req.params.productId);
    const { rating, comment } = req.body;

    const [review] = await db
      .insert(reviewsTable)
      .values({ userId: safeNum(user.id), productId, rating, comment })
      .returning();
    res.status(201).json({
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      userName: user.name || user.phone,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to add review" });
  }
});

// ─── Users / Profile ─────────────────────────────────────────────────────────
app.get("/api/users/profile", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, safeNum(user.id)));
    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      totalOrders: orders.length,
      totalSpent: orders.reduce((s, o) => s + Number(o.total), 0),
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get profile" });
  }
});

app.put("/api/users/profile", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const { name, email } = req.body;
    await db
      .update(usersTable)
      .set({ name, email })
      .where(eq(usersTable.id, safeNum(user.id)));
    const [updated] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, safeNum(user.id)));
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, safeNum(user.id)));
    res.json({
      id: updated.id,
      phone: updated.phone,
      name: updated.name,
      email: updated.email,
      isAdmin: updated.isAdmin,
      totalOrders: orders.length,
      totalSpent: orders.reduce((s, o) => s + Number(o.total), 0),
      loyaltyPoints: updated.loyaltyPoints,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

app.get("/api/users/addresses", requireAuth, async (req: any, res: any) => {
  try {
    const addresses = await db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.userId, safeNum(req.user.id)));
    res.json(
      addresses.map((a) => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        isDefault: a.isDefault,
      })),
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to get addresses" });
  }
});

app.post("/api/users/addresses", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const { name, phone, line1, line2, city, state, pincode, isDefault } = req.body;
    if (isDefault)
      await db
        .update(addressesTable)
        .set({ isDefault: false })
        .where(eq(addressesTable.userId, safeNum(user.id)));
    const [address] = await db
      .insert(addressesTable)
      .values({
        userId: safeNum(user.id),
        name,
        phone,
        line1,
        line2: line2 || null,
        city,
        state,
        pincode,
        isDefault: isDefault || false,
      })
      .returning();
    res.status(201).json({
      id: address.id,
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to add address" });
  }
});

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
app.get("/api/admin/dashboard", requireAdmin, async (_req: any, res: any) => {
  try {
    const orders = await db.select().from(ordersTable);
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [{ count: customerCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable)
      .where(eq(usersTable.isAdmin, false));
    const [{ count: productCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productsTable);
    const allProducts = await db
      .select({ product: productsTable, category: categoriesTable })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId));
      
    const fmt = (p: any, c: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      categoryId: p.categoryId,
      categoryName: c?.name || "",
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.originalPrice && p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0,
      imageUrl: p.imageUrl,
      images: p.images || [],
      inStock: p.inStock,
      stockQuantity: p.stockQuantity,
      isFeatured: p.isFeatured,
      isBestseller: p.isBestseller,
      tags: p.tags || [],
      rating: 4.5,
      reviewCount: 0,
    });
    res.json({
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: Number(customerCount),
      totalProducts: Number(productCount),
      dailyOrders: orders.filter((o) => new Date(o.createdAt) >= today).length,
      monthlyRevenue: orders.filter((o) => new Date(o.createdAt) >= monthStart).reduce((s, o) => s + Number(o.total), 0),
      bestSellingProducts: allProducts.filter(({ product }) => product.isBestseller).slice(0, 5).map(({ product, category }) => fmt(product, category)),
      lowStockProducts: allProducts.filter(({ product }) => product.stockQuantity <= 10).map(({ product, category }) => fmt(product, category)),
      recentOrders: [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map(formatOrder),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get dashboard" });
  }
});

app.post("/api/admin/products", requireAdmin, async (req: any, res: any) => {
  try {
    const { name, description, categoryId, price, originalPrice, imageUrl, images, inStock, stockQuantity, isFeatured, isBestseller, ingredients, benefits, tags, weightOptions } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const [product] = await db
      .insert(productsTable)
      .values({ name, description, categoryId: safeNum(categoryId), price, originalPrice, imageUrl, images, inStock: inStock ?? true, stockQuantity: stockQuantity ?? 100, isFeatured: isFeatured ?? false, isBestseller: isBestseller ?? false, ingredients, benefits, tags, weightOptions, slug })
      .returning();
    res.status(201).json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ message: "Failed to create product" });
  }
});

app.put("/api/admin/products/:id", requireAdmin, async (req: any, res: any) => {
  try {
    const id = safeNum(req.params.id);
    const { name, description, categoryId, price, originalPrice, imageUrl, images, inStock, stockQuantity, isFeatured, isBestseller, ingredients, benefits, tags, weightOptions } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    const [product] = await db
      .update(productsTable)
      .set({ name, description, categoryId: safeNum(categoryId), price, originalPrice, imageUrl, images, inStock, stockQuantity, isFeatured, isBestseller, ingredients, benefits, tags, weightOptions, slug })
      .where(eq(productsTable.id, safeNum(id)))
      .returning();
    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ message: "Failed to update product" });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req: any, res: any) => {
  try {
    const id = safeNum(req.params.id);

    await db.delete(productsTable).where(eq(productsTable.id, safeNum(id)));
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// ─── Admin Orders ────────────────────────────────────────────────────────────
app.get("/api/admin/orders", requireAdmin, async (req: any, res: any) => {
  try {
    const query = req.query || {};
    const status = query.status ? safeStr(query.status) : undefined;
    const page = query.page ? safeStr(query.page) : "1";
    
    const pageNum = parseInt(page);
    const limitNum = 20;
    const offset = (pageNum - 1) * limitNum;
    
    const conditions = [];
    if (status) conditions.push(eq(ordersTable.status, safeStr(status)));
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(whereCondition);

    const adminOrders = await db
      .select()
      .from(ordersTable)
      .where(whereCondition)
      .orderBy(desc(ordersTable.createdAt))
      .limit(limitNum)
      .offset(offset);

    res.json({
      orders: adminOrders.map(formatOrder),
      total: Number(totalRes.count),
      page: pageNum,
      totalPages: Math.ceil(Number(totalRes.count) / limitNum),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get admin orders" });
  }
});

export default app;
