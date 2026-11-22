"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { contactSchema, requirementSchema } from "@/lib/validation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { success: true } | { success: false; error: string };
const recordIdSchema = z.string().uuid("Invalid record ID.");
const requirementUpdateSchema = z.object({
  status: z.enum(["Open", "In Progress", "Matched", "Closed"]),
  matchedContactId: z.string().uuid().optional(),
});

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function parseTags(raw: string | undefined) {
  return [...new Set((raw ?? "").split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
}

export async function createContactAction(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { success: false, error: "Connect Supabase to save contacts." };
  const parsed = contactSchema.safeParse(formValues(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Check the form fields." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Your session has expired. Sign in again." };

  const { error } = await supabase.from("contacts").insert({
    user_id: user.id,
    full_name: parsed.data.full_name,
    company_name: parsed.data.company_name || null,
    type: parsed.data.type,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    city: parsed.data.city || null,
    country: parsed.data.country || null,
    linkedin_url: parsed.data.linkedin_url || null,
    tags: parseTags(parsed.data.tags),
    notes: parsed.data.notes || null,
    status: "Active",
  });
  if (error) return { success: false, error: `Could not save contact: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/contacts");
  return { success: true };
}

export async function updateContactAction(contactId: string, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { success: false, error: "Connect Supabase to update contacts." };
  if (!recordIdSchema.safeParse(contactId).success) return { success: false, error: "Invalid contact ID." };
  const parsed = contactSchema.safeParse(formValues(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Check the form fields." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Your session has expired. Sign in again." };
  const { error } = await supabase.from("contacts").update({
    full_name: parsed.data.full_name,
    company_name: parsed.data.company_name || null,
    type: parsed.data.type,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    city: parsed.data.city || null,
    country: parsed.data.country || null,
    linkedin_url: parsed.data.linkedin_url || null,
    tags: parseTags(parsed.data.tags),
    notes: parsed.data.notes || null,
    status: parsed.data.status ?? "Active",
    archived_at: parsed.data.status === "Archived" ? new Date().toISOString() : null,
  }).eq("id", contactId).eq("user_id", user.id);
  if (error) return { success: false, error: `Could not update contact: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/requirements");
  revalidatePath("/matching");
  return { success: true };
}

export async function archiveContactAction(contactId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { success: false, error: "Connect Supabase to archive contacts." };
  if (!recordIdSchema.safeParse(contactId).success) return { success: false, error: "Invalid contact ID." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Your session has expired. Sign in again." };
  const { error } = await supabase.from("contacts").update({
    status: "Archived",
    archived_at: new Date().toISOString(),
  }).eq("id", contactId).eq("user_id", user.id);
  if (error) return { success: false, error: `Could not archive contact: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/requirements");
  revalidatePath("/matching");
  return { success: true };
}

export async function createRequirementAction(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { success: false, error: "Connect Supabase to save requirements." };
  const parsed = requirementSchema.safeParse(formValues(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Check the form fields." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Your session has expired. Sign in again." };

  const { error } = await supabase.from("requirements").insert({
    user_id: user.id,
    contact_id: parsed.data.contact_id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    category: parsed.data.category || null,
    tags: parseTags(parsed.data.tags),
    urgency: parsed.data.urgency,
    status: parsed.data.status,
    follow_up_date: parsed.data.follow_up_date || null,
    matched_contact_id: null,
  });
  if (error) return { success: false, error: `Could not save requirement: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/requirements");
  revalidatePath("/matching");
  return { success: true };
}

export async function updateRequirementStatusAction(
  requirementId: string,
  status: "Open" | "In Progress" | "Matched" | "Closed",
  matchedContactId?: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { success: false, error: "Connect Supabase to update requirements." };
  if (!recordIdSchema.safeParse(requirementId).success) return { success: false, error: "Invalid requirement ID." };
  const parsed = requirementUpdateSchema.safeParse({ status, matchedContactId });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid requirement update." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Your session has expired. Sign in again." };

  const { error } = await supabase
    .from("requirements")
    .update({
      status: parsed.data.status,
      matched_contact_id: parsed.data.status === "Matched" ? parsed.data.matchedContactId ?? null : null,
    })
    .eq("id", requirementId)
    .eq("user_id", user.id);
  if (error) return { success: false, error: `Could not update requirement: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/requirements");
  revalidatePath("/matching");
  return { success: true };
}

export async function archiveRequirementAction(requirementId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { success: false, error: "Connect Supabase to archive requirements." };
  if (!recordIdSchema.safeParse(requirementId).success) return { success: false, error: "Invalid requirement ID." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Your session has expired. Sign in again." };
  const { error } = await supabase.from("requirements").update({
    archived_at: new Date().toISOString(),
  }).eq("id", requirementId).eq("user_id", user.id);
  if (error) return { success: false, error: `Could not archive requirement: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/requirements");
  revalidatePath("/matching");
  return { success: true };
}
