import { createClient } from "@supabase/supabase-js";

// Cliente Supabase para leitura pública no servidor (menu).
// Usa a anon key; a RLS garante que só devolve itens ativos.
export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
    }
  );
}
