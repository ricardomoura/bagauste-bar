"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let active = true;

    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (!active) return;
      const hasSession = !!data.session;
      setAuthed(hasSession);
      setReady(true);
      if (!hasSession && !isLogin) router.replace("/admin/login");
    });

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        setAuthed(!!session);
        if (!session && !isLogin) router.replace("/admin/login");
      }
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [isLogin, router]);

  // A página de login não usa a moldura do backoffice.
  if (isLogin) return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-navy/60">
        A carregar…
      </div>
    );
  }

  if (!authed) return null; // a redirecionar para o login

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-brand-sand/40">
      <header className="sticky top-0 z-20 border-b border-brand-sand bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpeg" alt="" className="h-full w-full object-contain" />
            </div>
            <span className="font-extrabold text-brand-navy">Backoffice</span>
          </div>
          <nav className="flex items-center gap-1 text-sm font-semibold">
            <Link
              href="/admin"
              className={`rounded-lg px-3 py-1.5 ${
                pathname === "/admin"
                  ? "bg-brand-navy text-white"
                  : "text-brand-navy hover:bg-brand-sand"
              }`}
            >
              Menu
            </Link>
            <Link
              href="/admin/qr"
              className={`rounded-lg px-3 py-1.5 ${
                pathname === "/admin/qr"
                  ? "bg-brand-navy text-white"
                  : "text-brand-navy hover:bg-brand-sand"
              }`}
            >
              QR Code
            </Link>
            <a
              href="/"
              target="_blank"
              className="rounded-lg px-3 py-1.5 text-brand-navy hover:bg-brand-sand"
            >
              Ver menu ↗
            </a>
            <button
              onClick={signOut}
              className="rounded-lg px-3 py-1.5 text-red-600 hover:bg-red-50"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
    </div>
  );
}
