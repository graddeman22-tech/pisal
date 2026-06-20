-- ============================================================
-- PISAL Store — Complete Database Schema
-- Run this in Supabase SQL Editor (once)
-- ============================================================

-- 1. CATEGORIES
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- 2. PRODUCTS
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  image_url text,
  category_slug text,
  category text,
  in_stock boolean default true,
  stock_quantity int default 100,
  is_featured boolean default false,
  is_bestseller boolean default false,
  tags text[] default '{}',
  rating numeric(3,1) default 4.5,
  reviews int default 0,
  created_at timestamptz default now()
);

-- 3. PROFILES (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  email text,
  phone text,
  avatar_url text,
  total_orders int default 0,
  loyalty_points int default 0,
  total_spent numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. ADDRESSES
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- 5. ORDERS
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  items jsonb not null default '[]',
  total_amount numeric(10,2) not null,
  discount_amount numeric(10,2) default 0,
  coupon_code text,
  status text default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_method text default 'cod',
  payment_status text default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  shipping_address jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. CART
create table if not exists public.cart (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  quantity int not null default 1,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- 7. WISHLIST
create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- 8. COUPONS
create table if not exists public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  description text,
  discount_type text default 'flat' check (discount_type in ('flat','percent')),
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) default 0,
  usage_limit int,
  usage_count int default 0,
  is_active boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.cart enable row level security;
alter table public.wishlist enable row level security;
alter table public.coupons enable row level security;

-- Public read for products, categories, coupons
create policy "Public read products" on public.products for select using (true);
create policy "Public read categories" on public.categories for select using (true);
create policy "Public read coupons" on public.coupons for select using (is_active = true);

-- Profiles: user can read/update own
create policy "User reads own profile" on public.profiles for select using (auth.uid() = id);
create policy "User updates own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "User upserts own profile" on public.profiles for update using (auth.uid() = id);

-- Addresses: user manages own
create policy "User reads own addresses" on public.addresses for select using (auth.uid() = user_id);
create policy "User inserts own address" on public.addresses for insert with check (auth.uid() = user_id);
create policy "User deletes own address" on public.addresses for delete using (auth.uid() = user_id);

-- Orders: user manages own
create policy "User reads own orders" on public.orders for select using (auth.uid() = user_id);
create policy "User creates own order" on public.orders for insert with check (auth.uid() = user_id);

-- Cart: user manages own
create policy "User reads own cart" on public.cart for select using (auth.uid() = user_id);
create policy "User inserts own cart" on public.cart for insert with check (auth.uid() = user_id);
create policy "User updates own cart" on public.cart for update using (auth.uid() = user_id);
create policy "User deletes own cart" on public.cart for delete using (auth.uid() = user_id);

-- Wishlist: user manages own
create policy "User reads own wishlist" on public.wishlist for select using (auth.uid() = user_id);
create policy "User inserts own wishlist" on public.wishlist for insert with check (auth.uid() = user_id);
create policy "User deletes own wishlist" on public.wishlist for delete using (auth.uid() = user_id);

-- ============================================================
-- SEED DATA — Categories
-- ============================================================
insert into public.categories (name, slug, description) values
  ('Ground Spices', 'ground-spices', 'Finely ground spice powders'),
  ('Whole Spices', 'whole-spices', 'Premium whole spices'),
  ('Masala Blends', 'masala-blends', 'Signature spice blends'),
  ('Seeds & Herbs', 'seeds-herbs', 'Seeds and dried herbs'),
  ('Special Blends', 'special-blends', 'Exclusive PISAL blends')
on conflict (slug) do nothing;

-- ============================================================
-- SEED DATA — Products
-- ============================================================
insert into public.products (name, description, price, original_price, image_url, category_slug, category, in_stock, stock_quantity, is_featured, is_bestseller, tags, rating, reviews) values
  ('Pure Turmeric Powder', '100% natural turmeric sourced from finest farms. Rich in curcumin with earthy aroma.', 149, 199, 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80', 'ground-spices', 'Ground Spices', true, 150, true, true, ARRAY['organic','bestseller'], 4.8, 234),
  ('Whole Black Pepper', 'Premium whole black pepper with intense aroma and bold flavor. Farm-fresh quality.', 189, 249, 'https://images.unsplash.com/photo-1599909631844-09b7fca23fe5?w=400&q=80', 'whole-spices', 'Whole Spices', true, 200, false, true, ARRAY['premium'], 4.7, 189),
  ('Garam Masala Blend', 'Classic North Indian spice blend. Perfect for curries, biryanis, and gravies.', 199, 279, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', 'masala-blends', 'Masala Blends', true, 120, true, true, ARRAY['bestseller','popular'], 4.9, 312),
  ('Red Chilli Powder', 'Bold and vibrant red chilli powder. Adds colour and heat to every dish.', 129, 179, 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&q=80', 'ground-spices', 'Ground Spices', true, 180, false, true, ARRAY['spicy'], 4.6, 156),
  ('Cumin Seeds (Jeera)', 'Aromatic cumin seeds, hand-picked and sun-dried. Enhance any dal or sabzi.', 159, 219, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', 'seeds-herbs', 'Seeds & Herbs', true, 250, true, false, ARRAY['organic'], 4.7, 98),
  ('Coriander Powder', 'Fresh ground coriander with a mild citrusy flavor. Essential Indian kitchen spice.', 109, 149, 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&q=80', 'ground-spices', 'Ground Spices', true, 200, false, false, ARRAY['everyday'], 4.5, 87),
  ('Cardamom Pods', 'Green cardamom pods, fragrant and fresh. For biryanis, chai, and desserts.', 349, 449, 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&q=80', 'whole-spices', 'Whole Spices', true, 80, true, false, ARRAY['premium','aromatic'], 4.9, 145),
  ('Mustard Seeds', 'Small and pungent black mustard seeds. Essential for tempering and pickling.', 89, 129, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', 'seeds-herbs', 'Seeds & Herbs', true, 300, false, false, ARRAY['everyday'], 4.4, 67),
  ('PISAL Biryani Masala', 'Exclusive PISAL signature blend for the perfect biryani. 18 spices, one perfect blend.', 249, 329, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', 'special-blends', 'Special Blends', true, 90, true, true, ARRAY['signature','popular'], 4.9, 278),
  ('Kashmiri Chilli', 'Vibrant red, low heat, deep colour. Authentic Kashmiri variety for rich curries.', 219, 299, 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=400&q=80', 'ground-spices', 'Ground Spices', true, 110, false, true, ARRAY['premium'], 4.8, 134),
  ('Fenugreek Seeds (Methi)', 'Slightly bitter, aromatic fenugreek seeds. For curries, dals, and pickling.', 99, 139, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80', 'seeds-herbs', 'Seeds & Herbs', true, 180, false, false, ARRAY['healthy'], 4.5, 54),
  ('PISAL Chai Masala', 'Signature tea masala with ginger, cardamom, cinnamon and more. Perfect morning brew.', 179, 239, 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&q=80', 'special-blends', 'Special Blends', true, 140, true, true, ARRAY['signature','bestseller'], 4.8, 198)
on conflict do nothing;

-- ============================================================
-- SEED DATA — Coupons
-- ============================================================
insert into public.coupons (code, description, discount_type, discount_value, min_order_amount, is_active) values
  ('PISAL20', 'Flat ₹20 off on all orders', 'flat', 20, 0, true),
  ('WELCOME50', 'Welcome offer — ₹50 off on first order', 'flat', 50, 199, true),
  ('SPICE10', '10% off on orders above ₹500', 'percent', 10, 500, true)
on conflict (code) do nothing;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
