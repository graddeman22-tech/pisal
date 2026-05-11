import { defineConfig } from "drizzle-kit";
import path from "path";

// Support both Supabase and regular PostgreSQL connections
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DB_URL must be set. Ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false,
  },
});
