export type ContactType = "Buyer" | "Seller" | "Founder" | "Agency" | "Other";
export type ContactStatus = "Active" | "Inactive" | "Archived";
export type RequirementStatus = "Open" | "In Progress" | "Matched" | "Closed";
export type Urgency = "Low" | "Medium" | "High";

export type Contact = {
  id: string;
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
};

export type Requirement = {
  id: string;
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
  contact?: Pick<Contact, "id" | "full_name" | "company_name" | "type" | "tags">;
};
