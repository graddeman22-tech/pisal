import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL must be set");
}

export default defineConfig({
  schema: "./api/_schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
    ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  },
});
