"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cockpitDb } from "@/lib/supabase/cockpit-db";

export async function upsertMonthlyGoal(formData: FormData): Promise<void> {
  const raw = formData.get("target_amount");
  const target = raw ? Number(String(raw).replace(",", ".")) : 0;
  if (!Number.isFinite(target) || target < 0) {
    redirect("/admin/finance?err=invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const start = new Date();
  start.setDate(1);
  const periodStart = start.toISOString().slice(0, 10);

  const db = cockpitDb(supabase);

  const { data: existing } = await db
    .from("financial_goals")
    .select("id")
    .eq("period_type", "month")
    .eq("period_start", periodStart)
    .maybeSingle();

  const payload = {
    period_type: "month" as const,
    period_start: periodStart,
    target_amount: target,
    notes: null as string | null,
  };

  const error = existing
    ? (await db.from("financial_goals").update(payload).eq("id", existing.id))
        .error
    : (await db.from("financial_goals").insert(payload)).error;

  revalidatePath("/admin");
  revalidatePath("/admin/finance");

  if (error) {
    redirect("/admin/finance?err=save");
  }

  redirect("/admin/finance?ok=month");
}

export async function updateDefaultMonthlyGoal(formData: FormData): Promise<void> {
  const raw = formData.get("default_monthly_goal");
  const target = raw ? Number(String(raw).replace(",", ".")) : 0;
  if (!Number.isFinite(target) || target < 0) {
    redirect("/admin/finance?err=invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const db = cockpitDb(supabase);
  const { error } = await db
    .from("business_settings")
    .update({ default_monthly_goal: target })
    .eq("id", 1);

  revalidatePath("/admin");
  revalidatePath("/admin/finance");

  if (error) {
    redirect("/admin/finance?err=save");
  }

  redirect("/admin/finance?ok=default");
}
