import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"],
    // // @ts-expect-error: Prisma 7.7.0 types are currently missing directUrl in this object, but the CLI requires it.
    // directUrl: process.env["DIRECT_URL"], 
  },
});