"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import type { InternalDocument } from "@/types/cockpit";
import { FileText, Trash2 } from "lucide-react";

export default function AdminDocumentsPage() {
  const supabase = createClient();
  const db = useMemo(() => cockpitDb(supabase), [supabase]);
  const [rows, setRows] = useState<InternalDocument[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    const { data } = await db
      .from("internal_documents")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data as InternalDocument[]) ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await db.from("internal_documents").insert({
      title: title.trim(),
      category: category || null,
      file_url: fileUrl || null,
      tags: tagList,
      notes: notes || null,
    });
    setTitle("");
    setCategory("");
    setFileUrl("");
    setTags("");
    setNotes("");
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ?")) return;
    await db.from("internal_documents").delete().eq("id", id);
    void load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Documents internes</h1>
        <p className="mt-1 text-sm text-astra-text-secondary">
          Références, liens vers fichiers (URL), tags. Upload fichier direct
          prévu en V2 (bucket Supabase).
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form onSubmit={addDoc} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="sm:col-span-2"
            />
            <Input
              label="Catégorie"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Input
              label="URL du fichier"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Tags (virgules)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="sm:col-span-2"
            />
            <Textarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="sm:col-span-2"
            />
            <Button type="submit" className="w-fit">
              Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div className="flex gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-astra-gold" />
                <div>
                  <p className="font-medium text-white">{r.title}</p>
                  <p className="text-xs text-astra-text-muted">
                    {r.category ?? "Sans catégorie"}
                    {r.tags?.length ? ` · ${r.tags.join(", ")}` : ""}
                  </p>
                  {r.file_url && (
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm text-astra-gold hover:underline"
                    >
                      Ouvrir le lien
                    </a>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void remove(r.id)}
                className="text-astra-text-muted hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
