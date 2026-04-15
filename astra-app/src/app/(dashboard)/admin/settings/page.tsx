'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Lock, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Profile } from '@/types/database';

export default function AdminSettingsPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setEmail(user.email ?? '');

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFullName(profileData.full_name);
      setPhone(profileData.phone ?? '');
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);

    await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone || null,
      })
      .eq('id', profile.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleChangePassword() {
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setChangingPassword(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-astra-card" />
        <div className="h-64 animate-pulse rounded-2xl bg-astra-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-astra-text">Paramètres</h1>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-medium text-astra-text">Profil</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Votre nom"
          />
          <Input
            label="Email"
            value={email}
            disabled
            className="opacity-60"
          />
          <Input
            label="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 00 00 00 00"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
          {saved && (
            <span className="text-sm text-astra-success">Profil mis à jour !</span>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-medium text-astra-text">Changer le mot de passe</h2>
        <div className="max-w-md space-y-4">
          <Input
            label="Mot de passe actuel"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="Confirmer le nouveau mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          {passwordError && (
            <p className="text-sm text-astra-danger">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-astra-success">Mot de passe mis à jour !</p>
          )}

          <Button
            variant="secondary"
            onClick={handleChangePassword}
            loading={changingPassword}
          >
            <Lock className="h-4 w-4" />
            Changer le mot de passe
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-astra-gold" />
          <h2 className="text-lg font-medium text-astra-text">Informations studio</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-astra-bg px-4 py-3">
            <span className="text-astra-text-secondary">Raison sociale</span>
            <span className="font-medium text-astra-text">Astra Studio</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-astra-bg px-4 py-3">
            <span className="text-astra-text-secondary">Dirigeant</span>
            <span className="font-medium text-astra-text">Yanis Revel</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-astra-bg px-4 py-3">
            <span className="text-astra-text-secondary">SIRET</span>
            <span className="font-mono font-medium text-astra-text">988 233 979 00018</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-astra-bg px-4 py-3">
            <span className="text-astra-text-secondary">Adresse</span>
            <span className="font-medium text-astra-text">23 rue Bardiaux, 03200 Vichy</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-astra-bg px-4 py-3">
            <span className="text-astra-text-secondary">Email</span>
            <span className="font-medium text-astra-text">bonjour@astrastudio.fr</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-astra-bg px-4 py-3">
            <span className="text-astra-text-secondary">TVA</span>
            <span className="text-astra-text-muted">Non applicable, art. 293 B du CGI</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
