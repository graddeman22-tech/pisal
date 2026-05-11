# Supabase Integration Guide

This guide will help you connect your e-commerce website to Supabase.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and pnpm installed

## Setup Steps

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Choose your organization
4. Enter project details:
   - **Project Name**: `pisal-store` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be set up (2-3 minutes)

### 2. Get Your Supabase Credentials

Once your project is ready, navigate to the **Project Settings** (gear icon in the sidebar):

1. **API Section**:
   - Copy the **Project URL** 
   - Copy the **anon public** key

2. **Database Section**:
   - Copy the **Connection string** (the one that starts with `postgresql://`)

### 3. Configure Environment Variables

Create a `.env` file in the root of your project:

```bash
# Copy the example file
cp .env.example .env
```

Edit the `.env` file with your Supabase credentials:

```env
# Replace with your actual Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_URL=https://your-project-ref.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

SUPABASE_DB_URL=postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres

PORT=3000
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Set Up Database Schema

The project uses Drizzle ORM with the following tables:
- `users` - Customer accounts and authentication
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Customer orders
- `cart` - Shopping cart
- `reviews` - Product reviews
- `coupons` - Discount codes
- `wishlist` - Customer wishlists
- `addresses` - Customer addresses

Run the database migrations:

```bash
cd lib/db
pnpm push
```

### 6. Start the Development Servers

**Backend API Server:**
```bash
cd artifacts/api-server
pnpm dev
```

**Frontend Store:**
```bash
cd artifacts/pisal-store
pnpm dev
```

### 7. Test the Connection

The application should now be connected to Supabase! You can:
- Visit the frontend store (usually at `http://localhost:5173`)
- Test user registration/login
- Browse products
- Add items to cart

## Features Available with Supabase

✅ **Real-time Updates** - Products, cart, and orders update in real-time
✅ **Authentication** - User signup/login with phone/email
✅ **Database** - Full PostgreSQL database with Drizzle ORM
✅ **File Storage** - Product images stored in Supabase Storage
✅ **Edge Functions** - Serverless functions for custom logic
✅ **Row Level Security** - Built-in data protection

## Troubleshooting

### Common Issues

1. **"Database connection failed"**
   - Check your `SUPABASE_DB_URL` in `.env`
   - Ensure the database password is correct
   - Verify the project reference is correct

2. **"Supabase client not initialized"**
   - Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Ensure environment variables are loaded

3. **Migration errors**
   - Run `pnpm push-force` in `lib/db` directory
   - Check table constraints and foreign keys

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review the [Drizzle ORM Documentation](https://orm.drizzle.team/)
- Check the console logs for detailed error messages

## Production Deployment

For production deployment:

1. **Environment Variables**: Set all environment variables in your hosting platform
2. **Database**: Use the production Supabase connection string
3. **Security**: Enable Row Level Security in Supabase
4. **Performance**: Consider enabling Supabase Edge Functions for API calls

## Next Steps

- Customize the UI/UX in the `pisal-store` frontend
- Add more products to your catalog
- Set up payment processing
- Configure email notifications
- Add admin panel for store management
