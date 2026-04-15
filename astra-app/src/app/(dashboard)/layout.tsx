import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar user={profile} />

      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <Header
          user={profile}
          unreadNotifications={unreadNotifications ?? 0}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="mx-auto w-full max-w-[1200px] flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
