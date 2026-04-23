import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";

// create client AFTER env loads
const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim(),
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim()
);

const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .limit(1);

console.log("DATA:", data);
console.log("ERROR:", error);