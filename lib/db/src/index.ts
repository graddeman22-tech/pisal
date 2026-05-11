import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Support both Supabase and regular PostgreSQL connections
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or SUPABASE_DB_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool for Supabase
export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });

// Also export Supabase client for direct Supabase features
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey) {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export * from "./schema";
