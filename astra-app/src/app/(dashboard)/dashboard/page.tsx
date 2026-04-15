import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatRelativeTime,
  truncate,
  formatDate,
  formatFileSize,
  firstNameFromFullName,
} from "@/lib/utils";
import {
  ArrowRight,
  Sparkles,
  Play,
  Image as ImageIcon,
  FileText,
  Package,
  Upload,
  Download,
} from "lucide-react";
import type { Lead, Notification } from "@/types/database";

const LEAD_STATUS_BADGE: Record<
  Lead["status"],
  { label: string; variant: "default" | "success" | "warning" | "danger" | "gold" | "muted" }
> = {
  new: { label: "Nouveau", variant: "gold" },
  contacted: { label: "Contacté", variant: "default" },
  call_scheduled: { label: "Call planifié", variant: "warning" },
  quoted: { label: "Devis envoyé", variant: "warning" },
  converted: { label: "Converti", variant: "success" },
  lost: { label: "Perdu", variant: "danger" },
};

async function AdminDashboardOverview({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [
    newLeadsRes,
    activeClientsRes,
    sentQuotesRes,
    preparingPacksRes,
    recentLeadsRes,
    notificationsRes,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent"),
    supabase
      .from("content_packs")
      .select("*", { count: "exact", head: true })
      .eq("status", "preparing"),
    supabase
      .from("leads")
      .select("id, first_name, email, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifications")
      .select("id, type, title, body, created_at, link")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const metrics = [
    {
      label: "Nouveaux prospects",
      value: newLeadsRes.count ?? 0,
      accent: "gold" as const,
      href: "/admin/leads",
    },
    {
      label: "Clients actifs",
      value: activeClientsRes.count ?? 0,
      accent: "green" as const,
      href: "/admin/clients",
    },
    {
      label: "Devis en attente",
      value: sentQuotesRes.count ?? 0,
      accent: "orange" as const,
      href: "/admin/quotes",
    },
    {
      label: "Packs à livrer",
      value: preparingPacksRes.count ?? 0,
      accent: "blue" as const,
      href: "/admin/delivery",
    },
  ];

  const accentRing: Record<(typeof metrics)[0]["accent"], string> = {
    gold: "ring-[#d4af37]/25",
    green: "ring-emerald-500/25",
    orange: "ring-amber-500/25",
    blue: "ring-sky-500/25",
  };

  const accentNum: Record<(typeof metrics)[0]["accent"], string> = {
    gold: "text-[#d4af37]",
    green: "text-emerald-400",
    orange: "text-amber-400",
    blue: "text-sky-400",
  };

  const recentLeads =
    (recentLeadsRes.data ?? []) as Pick<
      Lead,
      "id" | "first_name" | "email" | "message" | "status" | "created_at"
    >[];
  const activities = (notificationsRes.data ?? []) as Pick<
    Notification,
    "id" | "type" | "title" | "body" | "created_at" | "link"
  >[];

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Vue d&apos;ensemble
        </h2>
        <p className="mt-1 text-sm text-[#888888]">
          Pilotage rapide de l&apos;activité et des prochaines actions.
        </p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card
            key={m.label}
            className={`border border-white/[0.08] bg-[#111111] ring-1 ${accentRing[m.accent]}`}
          >
            <CardContent className="flex flex-col pt-6">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#888888]">
                {m.label}
              </p>
              <p
                className={`mt-2 text-4xl font-semibold tabular-nums ${accentNum[m.accent]}`}
              >
                {m.value}
              </p>
              <Link
                href={m.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#888888] transition-colors hover:text-[#d4af37]"
              >
                Voir <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Derniers prospects */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">Derniers prospects</h3>
          <Link
            href="/admin/leads"
            className="text-sm text-[#888888] transition-colors hover:text-[#d4af37]"
          >
            Tout voir →
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <Card className="border border-white/[0.08] bg-[#111111]">
            <CardContent className="py-12 text-center text-sm text-[#888888]">
              Aucun prospect pour le moment.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-[#888888]">
                    <th className="px-4 py-3">Prénom</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {recentLeads.map((lead) => {
                    const cfg = LEAD_STATUS_BADGE[lead.status];
                    return (
                      <tr key={lead.id} className="text-[#e5e5e5]">
                        <td className="px-4 py-3 font-medium text-white">
                          {lead.first_name}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-[#888888]">
                          {lead.email}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-3 text-[#888888]">
                          {truncate(lead.message, 72)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#888888]">
                          {formatDate(lead.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href="/admin/leads"
                            className="inline-flex items-center gap-1 text-[#d4af37] hover:underline"
                          >
                            Voir <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {recentLeads.map((lead) => {
                const cfg = LEAD_STATUS_BADGE[lead.status];
                return (
                  <Card
                    key={lead.id}
                    className="border border-white/[0.08] bg-[#111111]"
                  >
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-white">{lead.first_name}</p>
                          <p className="text-xs text-[#888888]">{lead.email}</p>
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-[#888888]">
                        {lead.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-[#555555]">
                        <span>{formatDate(lead.created_at)}</span>
                        <Link
                          href="/admin/leads"
                          className="text-[#d4af37]"
                        >
                          Voir →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Actions rapides */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-white">Actions rapides</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/admin/quotes/new"
            className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-[#111111] px-4 py-4 text-center text-sm font-medium text-white transition-colors hover:border-[#d4af37]/40 hover:bg-white/[0.03]"
          >
            Créer un devis
          </Link>
          <Link
            href="/admin/clients?action=new"
            className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-[#111111] px-4 py-4 text-center text-sm font-medium text-white transition-colors hover:border-[#d4af37]/40 hover:bg-white/[0.03]"
          >
            Ajouter un client
          </Link>
          <Link
            href="/admin/delivery?action=new"
            className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-[#111111] px-4 py-4 text-center text-sm font-medium text-white transition-colors hover:border-[#d4af37]/40 hover:bg-white/[0.03]"
          >
            Préparer un pack
          </Link>
        </div>
      </section>

      {/* Activité récente */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-white">
          Activité récente
        </h3>
        <Card className="border border-white/[0.08] bg-[#111111]">
          <CardContent className="divide-y divide-white/[0.06] p-0">
            {activities.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#888888]">
                Aucune activité récente.
              </p>
            ) : (
              activities.map((n) => {
                const line = n.title + (n.body ? ` — ${n.body}` : "");
                const href = n.link && n.link.startsWith("/") ? n.link : "/dashboard";
                return (
                  <Link
                    key={n.id}
                    href={href}
                    className="flex items-start justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="min-w-0 flex-1 text-sm text-[#e5e5e5]">
                      {line}
                    </span>
                    <span className="shrink-0 text-xs text-[#555555]">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

async function ClientDashboard({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const supabase = await createClient();
  const firstName = firstNameFromFullName(name);

  const { data: clientRow } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", userId)
    .single();

  const clientId = clientRow?.id;

  const [
    { data: latestPack },
    { count: deliveredPacksCount },
    { count: uploadsCount },
    { count: quotesCount },
  ] = await Promise.all([
    clientId
      ? supabase
          .from("content_packs")
          .select("*")
          .eq("client_id", clientId)
          .in("status", ["delivered", "downloaded"])
          .order("delivered_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    clientId
      ? supabase
          .from("content_packs")
          .select("*", { count: "exact", head: true })
          .eq("client_id", clientId)
          .in("status", ["delivered", "downloaded"])
      : Promise.resolve({ count: 0 }),
    clientId
      ? supabase
          .from("client_uploads")
          .select("*", { count: "exact", head: true })
          .eq("client_id", clientId)
      : Promise.resolve({ count: 0 }),
    clientId
      ? supabase
          .from("quotes")
          .select("*", { count: "exact", head: true })
          .eq("client_id", clientId)
      : Promise.resolve({ count: 0 }),
  ]);

  let latestPackFileCount = 0;
  let latestPackTotalSize = 0;
  if (latestPack) {
    const { data: packFiles } = await supabase
      .from("content_files")
      .select("file_size")
      .eq("pack_id", latestPack.id);
    if (packFiles) {
      latestPackFileCount = packFiles.length;
      latestPackTotalSize = packFiles.reduce(
        (sum, f) => sum + (f.file_size ?? 0),
        0,
      );
    }
  }

  /** Pack le plus récent : « nouveau » tant qu’il est livré mais pas entièrement téléchargé (statut delivered). */
  const showNewPackHighlight =
    latestPack != null && latestPack.status === "delivered";

  let recentFilesRaw: Array<{
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
    thumbnail_url: string | null;
    pack_id: string;
  }> = [];

  if (clientId) {
    const { data: packs } = await supabase
      .from("content_packs")
      .select("id")
      .eq("client_id", clientId)
      .in("status", ["delivered", "downloaded"]);

    if (packs && packs.length > 0) {
      const packIds = packs.map((p) => p.id);
      const { data: files } = await supabase
        .from("content_files")
        .select(
          "id, file_name, file_type, file_size, file_url, thumbnail_url, pack_id",
        )
        .in("pack_id", packIds)
        .order("created_at", { ascending: false })
        .limit(5);
      if (files) recentFilesRaw = files;
    }
  }

  const recentFiles = await Promise.all(
    recentFilesRaw.map(async (file) => {
      const { data: signed } = await supabase.storage
        .from("content-delivery")
        .createSignedUrl(file.file_url, 3600);
      const downloadUrl = signed?.signedUrl ?? null;
      let thumbUrl: string | null = null;
      if (file.file_type === "photo") {
        thumbUrl = downloadUrl;
      }
      return { ...file, downloadUrl, thumbUrl };
    }),
  );

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-astra-text">
          Bonjour {firstName} 👋
        </h2>
        <p className="mt-1 text-sm text-astra-text-secondary">
          Bienvenue dans votre espace Astra Studio.
        </p>
      </div>

      {showNewPackHighlight && latestPack ? (
        <Card className="mb-8 overflow-hidden border-astra-gold/30 bg-gradient-to-br from-astra-gold/[0.06] to-transparent">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-astra-gold" />
                <span className="text-sm font-semibold text-astra-gold">
                  Nouveau pack disponible ✨
                </span>
              </div>
              <p className="text-lg font-semibold text-astra-text">
                {latestPack.title} — {latestPackFileCount} fichier
                {latestPackFileCount !== 1 ? "s" : ""} —{" "}
                {formatFileSize(latestPackTotalSize)}
              </p>
            </div>
            <Link
              href={`/client/content/${latestPack.id}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-astra-gold px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-astra-gold/90"
            >
              Voir le pack →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
              <Package className="h-5 w-5 text-astra-text-muted" />
            </div>
            <div>
              <p className="text-sm font-medium text-astra-text-secondary">
                Pas de nouveau contenu pour le moment.
              </p>
              <p className="text-xs text-astra-text-muted">
                Votre prochain pack est en préparation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-astra-text">
                  {deliveredPacksCount ?? 0}
                </p>
                <p className="mt-1 text-sm text-astra-text-secondary">
                  Packs reçus
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10">
                <Package className="h-4 w-4 text-sky-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-astra-text">
                  {uploadsCount ?? 0}
                </p>
                <p className="mt-1 text-sm text-astra-text-secondary">
                  Fichiers envoyés
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10">
                <Upload className="h-4 w-4 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-astra-text">
                  {quotesCount ?? 0}
                </p>
                <p className="mt-1 text-sm text-astra-text-secondary">
                  Devis
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-astra-gold/10">
                <FileText className="h-4 w-4 text-astra-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-astra-text">
              Derniers fichiers reçus
            </h3>
            <Link
              href="/client/content"
              className="inline-flex items-center gap-1 text-xs text-astra-text-muted transition-colors hover:text-astra-gold"
            >
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentFiles.length > 0 ? (
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <Card key={file.id} hover>
                  <CardContent className="flex items-center gap-4 py-3">
                    <FileThumb
                      fileType={file.file_type}
                      thumbnailUrl={file.thumbUrl ?? file.thumbnail_url}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-astra-text">
                        {file.file_name}
                      </p>
                      <p className="text-xs text-astra-text-muted">
                        {formatFileSize(file.file_size)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        file.file_type === "video"
                          ? "gold"
                          : file.file_type === "photo"
                            ? "success"
                            : "default"
                      }
                    >
                      {file.file_type === "video"
                        ? "Vidéo"
                        : file.file_type === "photo"
                          ? "Photo"
                          : file.file_type === "document"
                            ? "Document"
                            : "Fichier"}
                    </Badge>
                    {file.downloadUrl ? (
                      <a
                        href={file.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg p-2 text-astra-text-muted transition-colors hover:bg-white/5 hover:text-astra-gold"
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link
                        href={`/client/content/${file.pack_id}`}
                        className="shrink-0 rounded-lg p-2 text-astra-text-muted transition-colors hover:bg-white/5 hover:text-astra-gold"
                        title="Voir le pack"
                      >
                        <Download className="h-4 w-4" />
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Package className="mx-auto mb-3 h-8 w-8 text-astra-text-muted" />
                <p className="text-sm text-astra-text-muted">
                  Aucun fichier reçu pour le moment.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-astra-text">
            Actions rapides
          </h3>
          <div className="space-y-3">
            <Link
              href="/client/uploads"
              className="flex items-center gap-3 rounded-xl bg-astra-gold px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-astra-gold/90"
            >
              <Upload className="h-4 w-4" />
              Envoyer un fichier
            </Link>
            <Link
              href="/client/content"
              className="flex items-center gap-3 rounded-xl border border-astra-border bg-astra-card px-4 py-3 text-sm font-medium text-astra-text transition-colors hover:border-astra-border-hover hover:bg-astra-card-hover"
            >
              <Package className="h-4 w-4" />
              Voir tous mes contenus
            </Link>
            <Link
              href="/client/quotes"
              className="flex items-center gap-3 rounded-xl border border-astra-border bg-astra-card px-4 py-3 text-sm font-medium text-astra-text transition-colors hover:border-astra-border-hover hover:bg-astra-card-hover"
            >
              <FileText className="h-4 w-4" />
              Voir mes devis
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function FileThumb({
  fileType,
  thumbnailUrl,
}: {
  fileType: string;
  thumbnailUrl: string | null;
}) {
  if (thumbnailUrl) {
    return (
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
        <img
          src={thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const iconMap: Record<string, React.ReactNode> = {
    video: <Play className="h-4 w-4 text-astra-gold" />,
    photo: <ImageIcon className="h-4 w-4 text-emerald-400" />,
    document: <FileText className="h-4 w-4 text-sky-400" />,
  };

  const bgMap: Record<string, string> = {
    video: "bg-astra-gold/10",
    photo: "bg-emerald-400/10",
    document: "bg-sky-400/10",
  };

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgMap[fileType] ?? "bg-white/5"}`}
    >
      {iconMap[fileType] ?? (
        <FileText className="h-4 w-4 text-astra-text-muted" />
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "client";
  const name = profile?.full_name ?? user.email ?? "Utilisateur";

  if (role === "admin") {
    return <AdminDashboardOverview userId={user.id} />;
  }

  return (
    <div>
      <ClientDashboard userId={user.id} name={name} />
    </div>
  );
}
