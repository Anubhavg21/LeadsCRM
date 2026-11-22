import { cache } from "react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { demoContacts, demoRequirements } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Contact, Requirement } from "@/types/crm";

export const getContacts = cache(async (): Promise<Contact[]> => {
  if (!isSupabaseConfigured) return demoContacts;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load contacts: ${error.message}`);
  return data ?? [];
});

export const getRequirements = cache(async (): Promise<Requirement[]> => {
  if (!isSupabaseConfigured) return demoRequirements;

  const supabase = await createClient();
  const [{ data: requirements, error }, { data: contacts, error: contactError }] =
    await Promise.all([
      supabase
        .from("requirements")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("contacts").select("id, full_name, company_name, type, tags"),
    ]);

  if (error) throw new Error(`Could not load requirements: ${error.message}`);
  if (contactError) throw new Error(`Could not load requirement contacts: ${contactError.message}`);

  const contactById = new Map((contacts ?? []).map((contact) => [contact.id, contact]));
  return (requirements ?? []).map((requirement) => ({
    ...requirement,
    contact: contactById.get(requirement.contact_id),
  }));
});

export const getDashboardData = cache(async () => {
  const [contacts, requirements] = await Promise.all([getContacts(), getRequirements()]);
  return { contacts, requirements };
});

export const getWorkspaceUser = cache(async () => {
  if (!isSupabaseConfigured) return { name: "Alex Morgan", email: "Preview workspace" };
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error && !isAuthSessionMissingError(error)) {
    throw new Error(`Could not load workspace user: ${error.message}`);
  }
  if (!user) return { name: "Your workspace", email: "" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw new Error(`Could not load profile: ${profileError.message}`);
  const name = profile?.full_name?.trim() || user.email?.split("@")[0] || "Your workspace";
  return { name, email: user.email ?? "" };
});
