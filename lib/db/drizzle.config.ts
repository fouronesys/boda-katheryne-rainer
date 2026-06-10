import { defineConfig } from "drizzle-kit";
import path from "path";

const dbFile = process.env.DATABASE_FILE ?? path.join(__dirname, "data/wedding.db");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbFile,
  },
});
