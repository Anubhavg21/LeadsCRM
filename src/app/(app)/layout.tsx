import { AppShell } from "@/components/app-shell";
import { getDashboardData, getWorkspaceUser } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getWorkspaceUser();
  if (isSupabaseConfigured && !user.email) redirect("/login");
  const { contacts, requirements } = await getDashboardData();
  return <AppShell contacts={contacts} requirements={requirements} user={user} renderedAt={Date.now()}>{children}</AppShell>;
}
