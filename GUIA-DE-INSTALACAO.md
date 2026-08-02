import { createClient } from "@supabase/supabase-js";

// Cliente Supabase para leitura pública no servidor (menu).
// Usa a anon key; a RLS garante que só devolve itens ativos.
// IMPORTANTE: força "no-store" em todos os pedidos para que o menu
// reflita SEMPRE as últimas alterações do backoffice (sem cache).
export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}
