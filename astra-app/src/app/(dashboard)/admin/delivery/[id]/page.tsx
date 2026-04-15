"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon,
  Film,
  FileText,
  GripVertical,
  Save,
  Send,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { formatDate, formatFileSize } from "@/lib/utils";
import { validateContentFile } from "@/lib/content/file-rules";
import { uploadWithProgress } from "@/lib/content/upload-to-pack";
import type { ContentPack, ContentFile, Client } from "@/types/database";

const STATUS_CONFIG: Record<
  ContentPack["status"],
  { label: string; variant: "warning" | "success" | "gold" }
> = {
  preparing: { label: "En préparation", variant: "warning" },
  delivered: { label: "Livré", variant: "success" },
  downloaded: { label: "Téléchargé", variant: "gold" },
};

const TYPE_BADGE: Record<
  ContentFile["file_type"],
  { label: string; variant: "gold" | "success" | "default" | "muted" }
> = {
  video: { label: "Vidéo", variant: "gold" },
  photo: { label: "Photo", variant: "success" },
  document: { label: "Document", variant: "default" },
  other: { label: "Autre", variant: "muted" },
};

type UploadRow = {
  id: string;
  name: string;
  progress: number;
  speedBps: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

function formatSpeed(bps: number): string {
  if (bps < 1024) return `${Math.round(bps)} o/s`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} Ko/s`;
  return `${(bps / (1024 * 1024)).toFixed(1)} Mo/s`;
}

export default function AdminDeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const packId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pack, setPack] = useState<ContentPack | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadRows, setUploadRows] = useState<UploadRow[]>([]);
  const [globalProgress, setGlobalProgress] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState("");

  const dragFileId = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: packData } = await supabase
      .from("content_packs")
      .select("*")
      .eq("id", packId)
      .single();

    if (packData) {
      setPack(packData);
      setTitle(packData.title);
      setDescription(packData.description ?? "");
      setMonth(packData.month);

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", packData.client_id)
        .single();
      setClient(clientData);
    }

    const { data: filesData } = await supabase
      .from("content_files")
      .select("*")
      .eq("pack_id", packId)
      .order("sort_order");

    const list = filesData ?? [];
    setFiles(list);

    const t: Record<string, string> = {};
    for (const f of list) {
      if (f.file_type === "photo") {
        const { data: s } = await supabase.storage
          .from("content-delivery")
          .createSignedUrl(f.file_url, 3600);
        if (s?.signedUrl) t[f.id] = s.signedUrl;
      }
    }
    setThumbs(t);
    setLoading(false);
  }, [supabase, packId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function processUploadQueue(fileList: File[]) {
    if (!pack || !client) return;

    const valid: File[] = [];
    for (const file of fileList) {
      const v = validateContentFile(file);
      if (!v.ok) {
        alert(v.error);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    const rows: UploadRow[] = valid.map((f) => ({
      id: `${f.name}-${f.size}-${Math.random()}`,
      name: f.name,
      progress: 0,
      speedBps: 0,
      status: "queued" as const,
    }));
    setUploadRows((prev) => [...prev, ...rows]);

    let completed = 0;
    const totalFiles = valid.length;

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      const rowId = rows[i].id;
      setUploadRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, status: "uploading" } : r
        )
      );

      const safeName = file.name.replace(/[^\w.\- ()\[\]]+/g, "_");
      const path = `${client.id}/${pack.id}/${safeName}`;

      const signRes = await fetch("/api/content/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          pack_id: pack.id,
          filename: safeName,
        }),
      });

      if (!signRes.ok) {
        setUploadRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? { ...r, status: "error", error: "URL signée refusée" }
              : r
          )
        );
        completed++;
        continue;
      }

      const { signedUrl, path: signedPath } = (await signRes.json()) as {
        signedUrl: string;
        path: string;
      };

      try {
        await uploadWithProgress(file, signedUrl, (loaded, total, speed) => {
          const pct = total ? Math.round((loaded / total) * 100) : 0;
          setUploadRows((prev) =>
            prev.map((r) =>
              r.id === rowId ? { ...r, progress: pct, speedBps: speed } : r
            )
          );
          const base = completed / totalFiles;
          const cur = (loaded / (total || 1)) * (1 / totalFiles);
          setGlobalProgress(Math.round((base + cur) * 100));
        });

        const reg = await fetch("/api/content/register-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pack_id: pack.id,
            path: signedPath,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || "application/octet-stream",
          }),
        });

        if (!reg.ok) {
          setUploadRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? { ...r, status: "error", error: "Enregistrement DB" }
                : r
            )
          );
        } else {
          setUploadRows((prev) =>
            prev.map((r) =>
              r.id === rowId ? { ...r, status: "done", progress: 100 } : r
            )
          );
        }
      } catch {
        setUploadRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? { ...r, status: "error", error: "Upload interrompu" }
              : r
          )
        );
      }

      completed++;
      setGlobalProgress(Math.round((completed / totalFiles) * 100));
    }

    await fetchData();
    setTimeout(() => {
      setUploadRows([]);
      setGlobalProgress(0);
    }, 2000);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0)
      void processUploadQueue(Array.from(e.dataTransfer.files));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      void processUploadQueue(Array.from(e.target.files));
      e.target.value = "";
    }
  }

  async function handleDeleteFile(file: ContentFile) {
    if (!client || !pack) return;
    await supabase.storage.from("content-delivery").remove([file.file_url]);
    await supabase.from("content_files").delete().eq("id", file.id);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }

  async function persistSortOrder(next: ContentFile[]) {
    setFiles(next);
    for (let i = 0; i < next.length; i++) {
      await supabase
        .from("content_files")
        .update({ sort_order: i })
        .eq("id", next[i].id);
    }
  }

  function onDragStartFile(id: string) {
    dragFileId.current = id;
  }

  function onDropOnFile(targetId: string) {
    const fromId = dragFileId.current;
    dragFileId.current = null;
    if (!fromId || fromId === targetId) return;
    const fromIdx = files.findIndex((f) => f.id === fromId);
    const toIdx = files.findIndex((f) => f.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...files];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    void persistSortOrder(next);
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("content_packs")
      .update({ title, description: description || null, month })
      .eq("id", packId);
    await fetchData();
    setSaving(false);
  }

  async function handleSaveDraft() {
    await handleSave();
  }

  async function handleDeliver() {
    if (
      !confirm(
        "Livrer ce pack au client ? Il recevra un email et une notification."
      )
    )
      return;
    setDelivering(true);
    const res = await fetch("/api/content/deliver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack_id: packId }),
    });
    setDelivering(false);
    if (res.ok) await fetchData();
    else {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Erreur livraison");
    }
  }

  async function handleResendNotification() {
    setDelivering(true);
    await fetch("/api/content/deliver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pack_id: packId, resend_only: true }),
    });
    setDelivering(false);
  }

  const totalSize = files.reduce((sum, f) => sum + f.file_size, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-astra-card" />
        <div className="h-96 animate-pulse rounded-2xl bg-astra-card" />
      </div>
    );
  }

  if (!pack || !client) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-astra-text-secondary">Pack introuvable.</p>
        <Link href="/admin/delivery" className="mt-4">
          <Button variant="secondary" size="sm">
            Retour
          </Button>
        </Link>
      </div>
    );
  }

  const config = STATUS_CONFIG[pack.status];
  const preparing = pack.status === "preparing";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/delivery">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-astra-text">
              {pack.title}
            </h1>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-astra-text-secondary">
            {client.company_name} • {pack.month}
          </p>
        </div>
      </div>

      {preparing && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-medium text-astra-text">
            Étape 1 — Infos du pack
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Mois"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Description (optionnel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </Card>
      )}

      {preparing && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-medium text-astra-text">
            Étape 2 — Fichiers
          </h2>

          <div
            className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-colors ${
              dragOver
                ? "border-astra-gold bg-astra-gold/10"
                : "border-astra-gold/40 bg-astra-bg hover:border-astra-gold/70"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mb-3 h-10 w-10 text-astra-gold/80" />
            <p className="text-center text-sm font-medium text-astra-text">
              Glissez vos fichiers ici ou cliquez pour parcourir
            </p>
            <p className="mt-2 max-w-lg text-center text-xs text-astra-text-muted">
              Vidéos (mp4, mov, avi… jusqu’à 5&nbsp;Go), photos (jpg, png, tiff…
              jusqu’à 200&nbsp;Mo), documents PDF/DOCX (jusqu’à 50&nbsp;Mo).
              Uploads simultanés avec progression.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="video/*,image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
          </div>

          {uploadRows.length > 0 && (
            <div className="mb-6 space-y-3">
              <div className="h-2 overflow-hidden rounded-full bg-astra-border">
                <div
                  className="h-full bg-astra-gold transition-all"
                  style={{ width: `${globalProgress}%` }}
                />
              </div>
              <p className="text-xs text-astra-text-muted">
                Progression globale du lot : {globalProgress}%
              </p>
              {uploadRows.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-astra-border bg-astra-bg px-3 py-2 text-xs"
                >
                  <span className="truncate text-astra-text">{r.name}</span>
                  <span className="text-astra-text-muted">
                    {r.status === "uploading" && (
                      <>
                        {r.progress}% · {formatSpeed(r.speedBps)}
                      </>
                    )}
                    {r.status === "done" && "✓ Terminé"}
                    {r.status === "error" && (
                      <span className="text-red-400">{r.error}</span>
                    )}
                    {r.status === "queued" && "En attente…"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-astra-bg px-4 py-2 text-sm text-astra-text-secondary">
            <span className="font-semibold text-astra-text">
              {files.length} fichier{files.length !== 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span>{formatFileSize(totalSize)}</span>
          </div>

          {files.length === 0 ? (
            <p className="py-8 text-center text-sm text-astra-text-muted">
              Aucun fichier ajouté.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {files.map((file) => {
                const typeBadge = TYPE_BADGE[file.file_type];
                const thumb = thumbs[file.id];
                return (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={() => onDragStartFile(file.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropOnFile(file.id)}
                    className="group relative overflow-hidden rounded-xl border border-astra-border bg-astra-bg"
                  >
                    <div className="absolute left-2 top-2 z-10 cursor-grab rounded bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="relative flex aspect-square items-center justify-center bg-[#111]">
                      {file.file_type === "photo" && thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : file.file_type === "video" ? (
                        <Film className="h-12 w-12 text-astra-text-muted" />
                      ) : (
                        <FileText className="h-12 w-12 text-astra-text-muted" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-xs font-medium text-astra-text">
                        {file.file_name}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant={typeBadge.variant}
                          className="text-[10px]"
                        >
                          {typeBadge.label}
                        </Badge>
                        <span className="text-[10px] text-astra-text-muted">
                          {formatFileSize(file.file_size)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteFile(file)}
                      className="absolute right-2 top-2 rounded bg-red-600/90 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-medium text-astra-text">
          Étape 3 — Livraison
        </h2>

        {preparing ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={handleSaveDraft} loading={saving}>
              <Save className="h-4 w-4" />
              Sauvegarder le brouillon
            </Button>
            <Button
              onClick={handleDeliver}
              loading={delivering}
              disabled={files.length === 0}
            >
              <Send className="h-4 w-4" />
              Livrer au client
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {pack.delivered_at && (
              <p className="text-sm text-astra-text-secondary">
                Livré le {formatDate(pack.delivered_at)}
              </p>
            )}
            <Button
              variant="secondary"
              onClick={handleResendNotification}
              loading={delivering}
            >
              <RefreshCw className="h-4 w-4" />
              Renvoyer la notification
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
