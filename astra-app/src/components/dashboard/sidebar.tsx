"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, X } from "lucide-react";

export interface SidebarUser {
  id: string;
  role: "admin" | "client";
  full_name: string;
  avatar_url: string | null;
}

const ADMIN_NAV: { label: string; href: string }[] = [
  { label: "📊 Dashboard", href: "/dashboard" },
  { label: "👥 Prospects", href: "/admin/leads" },
  { label: "🏢 Clients", href: "/admin/clients" },
  { label: "📄 Devis", href: "/admin/quotes" },
  { label: "📦 Livraisons", href: "/admin/delivery" },
  { label: "⚙️ Paramètres", href: "/admin/settings" },
];

const CLIENT_NAV: { label: string; href: string }[] = [
  { label: "📊 Mon espace", href: "/dashboard" },
  { label: "📦 Mes contenus", href: "/client/content" },
  { label: "📄 Mes devis", href: "/client/quotes" },
  { label: "📤 Mes envois", href: "/client/uploads" },
  { label: "👤 Mon profil", href: "/client/profile" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarShell({
  user,
  pathname,
  onNavigate,
}: {
  user: SidebarUser;
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const navItems = user.role === "admin" ? ADMIN_NAV : CLIENT_NAV;
  const [clientUploadNotifCount, setClientUploadNotifCount] = useState(0);

  useEffect(() => {
    if (user.role !== "admin") return;
    const supabase = createClient();
    let cancelled = false;
    void (async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .eq("type", "file_uploaded");
      if (!cancelled) setClientUploadNotifCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id, user.role]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const linkBase =
    "flex items-center rounded-lg border-l-2 border-transparent px-3 py-2.5 text-[14px] leading-snug transition-colors duration-200 ease-out";
  const linkInactive = "text-[#888888] hover:bg-white/[0.04] hover:text-white";
  const linkActive =
    "border-[#d4af37] bg-[rgba(212,175,55,0.08)] text-[#d4af37]";

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-4 pt-5 lg:pt-6">
        <Link
          href="/dashboard"
          className="flex items-center"
          onClick={onNavigate}
        >
          <Image
            src="/images/astra-logo.svg"
            alt="Astra Studio"
            width={140}
            height={32}
            className="h-8 max-h-[32px] w-auto"
            priority
          />
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-lg p-2 text-[#888888] transition-colors hover:bg-white/[0.04] hover:text-white lg:hidden"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-4 mt-4 h-px shrink-0 bg-white/[0.06]" />

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          const showFileBadge =
            user.role === "admin" &&
            item.href === "/admin/clients" &&
            clientUploadNotifCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`${linkBase} ${active ? linkActive : linkInactive}`}
            >
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {showFileBadge ? (
                <span
                  className="shrink-0 rounded-full bg-[#d4af37] px-1.5 py-0.5 text-[10px] font-bold leading-none text-black"
                  title="Nouveaux fichiers clients"
                >
                  {clientUploadNotifCount > 99 ? "99+" : clientUploadNotifCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[rgba(212,175,55,0.12)] text-xs font-semibold text-[#d4af37]">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(user.full_name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user.full_name}
            </p>
            <p className="truncate text-xs text-[#555555]">
              {user.role === "admin" ? "Administrateur" : "Client"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-transparent py-2.5 text-sm font-medium text-[#888888] transition-colors hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleToggle() {
      setMobileOpen((prev) => !prev);
    }
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[260px] border-r border-[rgba(255,255,255,0.06)] lg:block">
        <SidebarShell user={user} pathname={pathname} />
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer la navigation"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-[rgba(255,255,255,0.06)] transition-transform duration-200 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarShell
          user={user}
          pathname={pathname}
          onNavigate={closeMobile}
        />
      </aside>
    </>
  );
}
