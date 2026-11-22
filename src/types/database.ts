import type { ContactStatus, ContactType, RequirementStatus, Urgency } from "@/types/crm";

type ContactRow = {
  id: string;
  user_id: string;
  full_name: string;
  company_name: string | null;
  type: ContactType;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  linkedin_url: string | null;
  tags: string[];
  status: ContactStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type RequirementRow = {
  id: string;
  user_id: string;
  contact_id: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  urgency: Urgency;
  status: RequirementStatus;
  follow_up_date: string | null;
  matched_contact_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: ContactRow;
        Insert: Omit<ContactRow, "id" | "created_at" | "updated_at" | "archived_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
        Relationships: [];
      };
      requirements: {
        Row: RequirementRow;
        Insert: Omit<RequirementRow, "id" | "created_at" | "updated_at" | "archived_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["requirements"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: { id: string; full_name: string | null; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; created_at?: string; updated_at?: string };
        Update: { full_name?: string | null; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
