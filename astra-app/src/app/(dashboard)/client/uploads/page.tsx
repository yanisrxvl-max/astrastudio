'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { Download, Trash2, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { FileDropzone } from '@/components/uploads/file-dropzone';
import { uploadWithProgress } from '@/lib/content/upload-to-pack';
import { formatDate, formatFileSize, truncate } from '@/lib/utils';
import {
  validateClientUploadFile,
  classifyClientUploadType,
} from '@/lib/client-upload/rules';
import type { ClientUpload } from '@/types/database';

const ACCEPT =
  '.jpg,.jpeg,.png,.tiff,.tif,.mp4,.mov,.pdf,.docx,.pptx,.zip';

const TYPE_BADGE: Record<
  ClientUpload['file_type'],
  { label: string; variant: 'gold' | 'success' | 'default' | 'muted' | 'warning' }
> = {
  brief: { label: 'Brief', variant: 'gold' },
  asset: { label: 'Vidéo / ZIP', variant: 'warning' },
  photo: { label: 'Image', variant: 'success' },
  document: { label: 'Document', variant: 'default' },
  other: { label: 'Autre', variant: 'muted' },
};

type QueueItem = {
  id: string;
  file: File;
  notes: string;
  notifyEmail: boolean;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  speedBps: number;
  error?: string;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ClientUploadsPage() {
  const supabase = createClient();
  const formId = useId();

  const [uploads, setUploads] = useState<ClientUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      setLoading(false);
      return;
    }
    setClientId(client.id);

    const { data } = await supabase
      .from('client_uploads')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    setUploads(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function addFiles(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    const next: QueueItem[] = [];
    for (const file of arr) {
      const err = validateClientUploadFile(file);
      if (err) {
        alert(`${file.name}: ${err}`);
        continue;
      }
      next.push({
        id: newId(),
        file,
        notes: '',
        notifyEmail: false,
        status: 'pending',
        progress: 0,
        speedBps: 0,
      });
    }
    if (next.length) setQueue((q) => [...q, ...next]);
  }

  function removeFromQueue(id: string) {
    setQueue((q) => q.filter((x) => x.id !== id));
  }

  function updateQueue(id: string, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function sendQueue() {
    const toProcess = queue.filter(
      (x) => x.status === 'pending' || x.status === 'error'
    );
    if (toProcess.length === 0) return;
    setSending(true);

    for (const item of toProcess) {
      const safeName = item.file.name.replace(/[^\w.\- ()\[\]]+/g, '_');

      updateQueue(item.id, { status: 'uploading', progress: 0, error: undefined });

      const signRes = await fetch('/api/client-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: safeName }),
      });

      if (!signRes.ok) {
        updateQueue(item.id, {
          status: 'error',
          error: 'Impossible d’obtenir l’URL d’envoi.',
        });
        continue;
      }

      const { signedUrl, path } = (await signRes.json()) as {
        signedUrl: string;
        path: string;
      };

      try {
        await uploadWithProgress(item.file, signedUrl, (loaded, total, speed) => {
          const pct = total ? Math.round((loaded / total) * 100) : 0;
          updateQueue(item.id, { progress: pct, speedBps: speed });
        });

        const completeRes = await fetch('/api/client-uploads/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path,
            file_name: item.file.name,
            file_size: item.file.size,
            mime_type: item.file.type || 'application/octet-stream',
            notes: item.notes.trim() || null,
            notify_email: item.notifyEmail,
          }),
        });

        if (!completeRes.ok) {
          const j = (await completeRes.json().catch(() => ({}))) as { error?: string };
          updateQueue(item.id, {
            status: 'error',
            error: j.error || 'Enregistrement refusé.',
          });
          continue;
        }

        updateQueue(item.id, { status: 'done', progress: 100 });
      } catch {
        updateQueue(item.id, {
          status: 'error',
          error: 'Transfert interrompu.',
        });
      }
    }

    setSending(false);
    setQueue((q) => q.filter((x) => x.status !== 'done'));
    await fetchData();
  }

  async function handleDownload(upload: ClientUpload) {
    const { data } = await supabase.storage
      .from('client-uploads')
      .createSignedUrl(upload.file_url, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function handleDelete(upload: ClientUpload) {
    if (!confirm('Supprimer ce fichier définitivement ?')) return;
    setDeleting(upload.id);

    const res = await fetch('/api/client-uploads/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: upload.id }),
    });

    setDeleting(null);
    if (res.ok) {
      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
    } else {
      alert('Suppression impossible.');
    }
  }

  const pendingCount = queue.filter((x) => x.status === 'pending' || x.status === 'error').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-astra-text">Vos fichiers</h1>
        <p className="mt-1 text-sm text-astra-text-secondary">
          Envoyez-nous vos assets, briefs et documents. Tout est centralisé ici.
        </p>
      </div>

      <Card className="p-6">
        <FileDropzone
          accept={ACCEPT}
          disabled={sending}
          onFiles={addFiles}
          subhint="JPG, PNG, TIFF, MP4, MOV, PDF, DOCX, PPTX, ZIP — max 500 Mo par fichier"
        />

        {queue.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-astra-text">
                Fichiers à envoyer ({queue.length})
              </p>
              <Button
                onClick={() => void sendQueue()}
                loading={sending}
                disabled={pendingCount === 0}
              >
                Envoyer
              </Button>
            </div>

            {queue.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-astra-border bg-astra-bg/80 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-astra-text">
                        {item.file.name}
                      </p>
                      <span className="text-xs text-astra-text-muted">
                        {formatFileSize(item.file.size)}
                        {' · '}
                        {TYPE_BADGE[classifyClientUploadType(item.file.type, item.file.name)].label}
                      </span>
                    </div>

                    {item.status === 'uploading' && (
                      <div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-astra-card">
                          <div
                            className="h-full bg-astra-gold transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-astra-text-muted">
                          {item.progress}% ·{' '}
                          {item.speedBps > 0
                            ? `${formatFileSize(item.speedBps)}/s`
                            : '…'}
                        </p>
                      </div>
                    )}

                    {item.status === 'error' && item.error && (
                      <p className="text-xs text-red-400">{item.error}</p>
                    )}

                    <Textarea
                      id={`${formId}-notes-${item.id}`}
                      placeholder="Note (optionnelle) — décrivez le contenu"
                      value={item.notes}
                      onChange={(e) =>
                        updateQueue(item.id, { notes: e.target.value })
                      }
                      rows={2}
                      disabled={sending && item.status === 'uploading'}
                    />

                    <label className="flex cursor-pointer items-center gap-2 text-sm text-astra-text-secondary">
                      <input
                        type="checkbox"
                        checked={item.notifyEmail}
                        onChange={(e) =>
                          updateQueue(item.id, { notifyEmail: e.target.checked })
                        }
                        disabled={sending && item.status === 'uploading'}
                        className="rounded border-astra-border bg-astra-bg"
                      />
                      Notifier l’équipe par email (fichier important)
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.id)}
                    disabled={item.status === 'uploading'}
                    className="shrink-0 text-astra-text-muted hover:text-white disabled:opacity-40"
                    aria-label="Retirer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-astra-card" />
          ))}
        </div>
      ) : uploads.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <FileText className="h-10 w-10 text-astra-text-muted" />
          <p className="mt-3 text-sm text-astra-text-secondary">Aucun fichier envoyé.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-astra-border text-left text-astra-text-muted">
                  <th className="px-5 py-3 font-medium">Fichier</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Taille</th>
                  <th className="px-5 py-3 font-medium">Note</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => {
                  const typeBadge = TYPE_BADGE[upload.file_type];
                  return (
                    <tr key={upload.id} className="border-b border-astra-border/50">
                      <td className="px-5 py-3">
                        <span className="font-medium text-astra-text">
                          {truncate(upload.file_name, 36)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-astra-text-secondary">
                        {formatFileSize(upload.file_size)}
                      </td>
                      <td className="max-w-[200px] px-5 py-3 text-astra-text-muted">
                        {upload.notes ? truncate(upload.notes, 48) : '—'}
                      </td>
                      <td className="px-5 py-3 text-astra-text-secondary">
                        {formatDate(upload.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void handleDownload(upload)}
                            className="rounded-lg p-1.5 text-astra-text-secondary transition-colors hover:bg-white/5 hover:text-white"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {upload.uploaded_by === userId && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(upload)}
                              disabled={deleting === upload.id}
                              className="rounded-lg p-1.5 text-astra-text-muted transition-colors hover:bg-white/5 hover:text-red-400 disabled:opacity-50"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
