"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Bar } from "@/lib/types";
import { AdminCtx } from "@/components/admin/AdminContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  const [bars, setBars] = useState<Bar[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [barId, setBarId] = useState<string | null>(null);

  const reloadBars = useCallback(async () => {
    const { data: userData } = await supabaseBrowser.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    const { data: adminRows } = await supabaseBrowser
      .from("app_admins")
      .select("user_id");
    const admin = (adminRows ?? []).some((r: any) => r.user_id === uid);

    let list: Bar[] = [];
    if (admin) {
      const { data } = await supabaseBrowser
        .from("bars")
        .select("*")
        .order("sort_order", { ascending: true });
      list = (data ?? []) as Bar[];
    } else {
      const { data: mem } = await supabaseBrowser
        .from("bar_members")
        .select("bar_id");
      const ids = (mem ?? []).map((m: any) => m.bar_id);
      if (ids.length) {
        const { data } = await supabaseBrowser
          .from("bars")
          .select("*")
          .in("id", ids)
          .order("sort_order", { ascending: true });
        list = (data ?? []) as Bar[];
      }
    }

    setIsAdmin(admin);
    setBars(list);
    setBarId((prev) =>
      prev && list.some((b) => b.id === prev) ? prev : list[0]?.id ?? null
    );
  }, []);

  useEffect(() => {
    let active = true;
    supabaseBrowser.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const hasSession = !!data.session;
      setAuthed(hasSession);
      if (!hasSession && !isLogin) {
        router.replace("/admin/login");
        setReady(true);
        return;
      }
      if (hasSession) await reloadBars();
      setReady(true);
    });

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      if (!session && !isLogin) router.replace("/admin/login");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [isLogin, router, reloadBars]);

  const selectedBar = useMemo(
    () => bars.find((b) => b.id === barId) ?? null,
    [bars, barId]
  );

  if (isLogin) return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-navy/60">
        A carregar…
      </div>
    );
  }
  if (!authed) return null;

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    router.replace("/admin/login");
  }

  const linkCls = (active: boolean) =>
    `rounded-lg px-3 py-1.5 ${active ? "bg-brand-navy text-white" : "text-brand-navy hover:bg-brand-sand"}`;

  return (
    <AdminCtx.Provider value={{ bars, barId, setBarId, selectedBar, isAdmin, reloadBars }}>
      <div className="min-h-screen bg-brand-sand/40">
        <header className="sticky top-0 z-20 border-b border-brand-sand bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-3">
            <span className="font-extrabold text-brand-navy">Backoffice</span>

            {/* Seletor de bar */}
            {bars.length > 0 && (
              <select
                value={barId ?? ""}
                onChange={(e) => setBarId(e.target.value)}
                className="rounded-lg border border-brand-navy/15 bg-white px-3 py-1.5 text-sm font-semibold text-brand-navy"
              >
                {bars.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            <nav className="ml-auto flex items-center gap-1 text-sm font-semibold">
              <Link href="/admin" className={linkCls(pathname === "/admin")}>
                Menu
              </Link>
              <Link href="/admin/qr" className={linkCls(pathname === "/admin/qr")}>
                QR Code
              </Link>
              {isAdmin && (
                <Link href="/admin/bars" className={linkCls(pathname === "/admin/bars")}>
                  Bares
                </Link>
              )}
              {selectedBar && (
                <a
                  href={`/${selectedBar.slug}`}
                  target="_blank"
                  className="rounded-lg px-3 py-1.5 text-brand-navy hover:bg-brand-sand"
                >
                  Ver menu ↗
                </a>
              )}
              <button onClick={signOut} className="rounded-lg px-3 py-1.5 text-red-600 hover:bg-red-50">
                Sair
              </button>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-5 py-6">
          {bars.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-navy/20 bg-white p-10 text-center text-brand-navy/60">
              A sua conta ainda não tem nenhum bar associado. Peça ao administrador para o adicionar a um bar.
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </AdminCtx.Provider>
  );
}
