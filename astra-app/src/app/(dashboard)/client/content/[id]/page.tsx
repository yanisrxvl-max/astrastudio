'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Play,
  FileText,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDate, formatFileSize, truncate } from '@/lib/utils';
import type { ContentPack, ContentFile } from '@/types/database';

const TYPE_BADGE: Record<
  ContentFile['file_type'],
  { label: string; variant: 'gold' | 'success' | 'default' | 'muted' }
> = {
  video: { label: 'Vidéo', variant: 'gold' },
  photo: { label: 'Photo', variant: 'success' },
  document: { label: 'Document', variant: 'default' },
  other: { label: 'Autre', variant: 'muted' },
};

export default function ClientContentDetailPage() {
  const params = useParams();
  const supabase = createClient();
  const packId = params.id as string;

  const [pack, setPack] = useState<ContentPack | null>(null);
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: packData } = await supabase
      .from('content_packs')
      .select('*')
      .eq('id', packId)
      .single();

    if (packData) {
      setPack(packData);
    }

    const { data: filesData } = await supabase
      .from('content_files')
      .select('*')
      .eq('pack_id', packId)
      .order('sort_order');

    const loadedFiles = filesData ?? [];
    setFiles(loadedFiles);

    const thumbs: Record<string, string> = {};
    for (const file of loadedFiles) {
      if (file.file_type === 'photo') {
        const { data: signedData } = await supabase.storage
          .from('content-delivery')
          .createSignedUrl(file.file_url, 3600);
        if (signedData?.signedUrl) {
          thumbs[file.id] = signedData.signedUrl;
        }
      }
    }
    setThumbnails(thumbs);
    setLoading(false);
  }, [supabase, packId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!packId || loading || !pack) return;
    void fetch('/api/content/mark-opened', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack_id: packId }),
    });
  }, [packId, loading, pack]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxUrl(null);
        setVideoUrl(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function handleDownload(file: ContentFile) {
    setDownloading(file.id);
    const { data } = await supabase.storage
      .from('content-delivery')
      .createSignedUrl(file.file_url, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      await fetch('/api/content/mark-file-downloaded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: file.id }),
      });
      await fetchData();
    }
    setDownloading(null);
  }

  async function handleDownloadAll() {
    if (files.length === 0) return;
    setDownloadingAll(true);
    for (const file of files) {
      const { data } = await supabase.storage
        .from('content-delivery')
        .createSignedUrl(file.file_url, 3600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
        await fetch('/api/content/mark-file-downloaded', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_id: file.id }),
        });
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    await fetchData();
    setDownloadingAll(false);
  }

  async function openVideoPlayer(file: ContentFile) {
    const { data } = await supabase.storage
      .from('content-delivery')
      .createSignedUrl(file.file_url, 3600);
    if (data?.signedUrl) setVideoUrl(data.signedUrl);
  }

  const totalSize = files.reduce((sum, f) => sum + f.file_size, 0);
  const zipReasonable = totalSize > 0 && totalSize < 500 * 1024 * 1024;

  if (loading) {
    return (
      <div className="min-h-[50vh] space-y-6 bg-[#0a0a0a] px-0 py-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-900" />
        <div className="h-96 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center bg-[#0a0a0a] py-16 text-zinc-300">
        <p className="text-zinc-500">Pack introuvable.</p>
        <Link href="/client/content" className="mt-4">
          <Button variant="secondary" size="sm">Retour</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] space-y-8 bg-[#0a0a0a] px-0 py-2 text-zinc-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/client/content">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{pack.title}</h1>
            <p className="mt-1 text-sm text-zinc-400">{pack.month}</p>
            {pack.description ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">
                {pack.description}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
              <span>
                {files.length} fichier{files.length !== 1 ? 's' : ''}
              </span>
              <span className="text-zinc-700">•</span>
              <span>{formatFileSize(totalSize)}</span>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              className="border-zinc-700"
              onClick={() => void handleDownloadAll()}
              loading={downloadingAll}
            >
              <Download className="h-4 w-4" />
              Tout télécharger
            </Button>
          </div>
        )}
      </div>

      {!zipReasonable && files.length > 1 && (
        <p className="text-xs text-zinc-500">
          Les packs volumineux : privilégiez le téléchargement fichier par fichier (plus fiable que
          une archive serveur).
        </p>
      )}

      {files.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-zinc-800 bg-zinc-900/40 py-16">
          <p className="text-sm text-zinc-500">Aucun fichier dans ce pack.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => {
            const typeBadge = TYPE_BADGE[file.file_type];
            const thumb = thumbnails[file.id];

            return (
              <div
                key={file.id}
                className="group overflow-hidden rounded-xl border border-zinc-800 bg-[#111] transition-colors hover:border-amber-500/50"
              >
                <button
                  type="button"
                  className="relative block w-full text-left"
                  onClick={() => {
                    if (file.file_type === 'photo' && thumb) setLightboxUrl(thumb);
                    else if (file.file_type === 'video') void openVideoPlayer(file);
                  }}
                >
                  {file.file_type === 'photo' && thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs signées dynamiques
                    <img
                      src={thumb}
                      alt={file.file_name}
                      className="aspect-square w-full object-cover"
                    />
                  ) : file.file_type === 'video' ? (
                    <div className="relative aspect-video w-full bg-zinc-950">
                      <div className="absolute inset-0 bg-black/55" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                          <Play className="ml-1 h-7 w-7 text-white/90" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-zinc-950">
                      <FileText className="h-12 w-12 text-zinc-600" />
                    </div>
                  )}
                </button>

                <div className="p-3">
                  <p className="truncate text-xs font-medium text-zinc-200">
                    {truncate(file.file_name, 32)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant={typeBadge.variant} className="text-[10px]">
                      {typeBadge.label}
                    </Badge>
                    <span className="text-[10px] text-zinc-500">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDownload(file)}
                    disabled={downloading === file.id}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50"
                  >
                    <Download className="h-3 w-3" />
                    Télécharger
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pack.delivered_at && (
        <p className="text-center text-xs text-zinc-600">
          Livré le {formatDate(pack.delivered_at)}
        </p>
      )}

      {lightboxUrl && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxUrl(null)}
          aria-label="Fermer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute right-4 top-4 rounded-full bg-zinc-900 p-2 text-zinc-300">
            <X className="h-6 w-6" />
          </span>
        </button>
      )}

      {videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-zinc-900 p-2 text-zinc-300"
            onClick={() => setVideoUrl(null)}
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
          <video
            src={videoUrl}
            controls
            className="max-h-[85vh] max-w-full rounded-lg"
            playsInline
          />
        </div>
      )}
    </div>
  );
}
