"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import type { Tables } from "@/types/database";
import type { SavedPlace } from "@/types/cockpit";
import { MapPin, Navigation, ExternalLink } from "lucide-react";

export default function AdminLocationsPage() {
  const supabase = createClient();
  const db = useMemo(() => cockpitDb(supabase), [supabase]);
  const [rows, setRows] = useState<SavedPlace[]>([]);
  const [clients, setClients] = useState<Tables<"clients">[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [locating, setLocating] = useState(false);

  async function load() {
    const [{ data: p }, { data: c }] = await Promise.all([
      db.from("saved_places").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("*").order("company_name"),
    ]);
    setRows((p as SavedPlace[]) ?? []);
    setClients((c as Tables<"clients">[]) ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  function useCurrentPosition() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function addPlace(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await db.from("saved_places").insert({
      name: name.trim(),
      address: address || null,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      client_id: clientId || null,
      notes: notes || null,
    });
    setName("");
    setAddress("");
    setNotes("");
    void load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Terrain & lieux</h1>
        <p className="mt-1 text-sm text-astra-text-secondary">
          Repères pour shootings et rendez-vous. Coordonnées manuelles ou via
          géolocalisation navigateur.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <MapPin className="h-4 w-4 text-astra-gold" />
            <span className="text-sm font-medium text-white">Nouveau lieu</span>
          </div>
          <form onSubmit={addPlace} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Adresse"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              label="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="ex. 48.8566"
            />
            <Input
              label="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="ex. 2.3522"
            />
            <Button
              type="button"
              variant="secondary"
              className="sm:col-span-2 w-fit"
              onClick={useCurrentPosition}
              loading={locating}
            >
              <Navigation className="mr-2 h-4 w-4" />
              Utiliser ma position
            </Button>
            <Select
              label="Client lié (optionnel)"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="sm:col-span-2"
            >
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </Select>
            <Textarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="sm:col-span-2"
            />
            <Button type="submit" className="sm:col-span-2 w-fit">
              Enregistrer le lieu
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">{r.name}</p>
                <p className="text-sm text-astra-text-secondary">
                  {r.address ?? "Pas d'adresse"}
                  {r.lat != null && r.lng != null && (
                    <span className="ml-2 tabular-nums text-astra-text-muted">
                      {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                    </span>
                  )}
                </p>
              </div>
              {r.lat != null && r.lng != null && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}&zoom=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-astra-gold"
                >
                  Carte <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-astra-text-muted">Aucun lieu enregistré.</p>
        )}
      </div>
    </div>
  );
}
