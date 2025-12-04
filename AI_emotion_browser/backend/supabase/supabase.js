// supabase/supabase.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // service_role_key
  {
    auth: { persistSession: false }
  }
);

export default supabase;
