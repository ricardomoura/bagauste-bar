"use client";

import { createClient } from "@supabase/supabase-js";

// Cliente Supabase para o browser (backoffice).
// A sessão é guardada automaticamente no localStorage.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
