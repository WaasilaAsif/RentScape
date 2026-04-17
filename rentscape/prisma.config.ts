import "dotenv/config";
import { defineConfig } from "prisma/config";
// Only for debugging purposes, remove this line in production
// console.log("DATABASE_URL:", process.env["DATABASE_URL"]);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL_IPV4"] 
  },
});