"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { SidebarUser } from "@/components/dashboard/sidebar";

function getPageTitle(pathname: string, role: "admin" | "client"): string {
  if (pathname === "/dashboard") {
    return role === "admin" ? "Dashboard" : "Mon espace";
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "admin") {
    const map: Record<string, string> = {
      leads: "Prospects",
      clients: "Clients",
      quotes: "Devis",
      delivery: "Livraisons",
      settings: "Paramètres",
      finance: "Finance",
      invoices: "Factures",
      projects: "Projets",
      documents: "Documents",
      locations: "Terrain",
      priorities: "Priorités",
      academy: "Formations",
    };
    const key = segments[1] ?? "";
    if (key && map[key]) {
      if (segments[2] && ["clients", "quotes", "delivery", "invoices", "projects"].includes(key)) {
        return `${map[key]} — détail`;
      }
      return map[key];
    }
    if (pathname.startsWith("/admin") && segments.length === 1) return "Administration";
    return "Administration";
  }

  if (segments[0] === "client") {
    const map: Record<string, string> = {
      content: "Mes contenus",
      quotes: "Mes devis",
      uploads: "Mes envois",
      profile: "Mon profil",
    };
    const key = segments[1] ?? "";
    if (key && map[key]) {
      if (segments[2]) return `${map[key]} — détail`;
      return map[key];
    }
  }

  return "Astra Studio";
}

export function Header({
  user,
  unreadNotifications,
}: {
  user: SidebarUser;
  unreadNotifications: number;
}) {
  const pathname = usePathname();
  const title = useMemo(
    () => getPageTitle(pathname, user.role),
    [pathname, user.role],
  );

  function toggleSidebar() {
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 bg-[#0a0a0a] px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="shrink-0 rounded-lg p-2 text-[#888888] transition-colors hover:bg-white/[0.04] hover:text-white lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-lg font-semibold tracking-tight text-white lg:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/dashboard"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[#888888] transition-colors hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          title="Notifications"
          aria-label="Notifications"
        >
          <span className="text-base leading-none">🔔</span>
          {unreadNotifications > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d4af37] px-1 text-[11px] font-bold leading-none text-black">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
