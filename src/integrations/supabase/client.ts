import { createClient } from "@supabase/supabase-js";
import { auth } from "@/lib/firebase";
import type { Database } from "./types";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://lflkzaeevvipwalveybc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_HmLJuTayQGUaA3UIoCe2ug_GUcCpMgl";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  accessToken: async () => {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      // Avoid unnecessary network requests; Firebase caches the token and auto-refreshes when expired
      return await user.getIdToken(/* forceRefresh */ false);
    } catch (error) {
      console.error("Failed to get Firebase ID token:", error);
      return null;
    }
  },
});
