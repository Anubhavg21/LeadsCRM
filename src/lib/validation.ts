import { z } from "zod";

export const contactSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  company_name: z.string().trim().max(120).optional().or(z.literal("")),
  type: z.enum(["Buyer", "Seller", "Founder", "Agency", "Other"]),
  email: z.string().trim().email("Enter a valid email address").max(254).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  linkedin_url: z.string().trim().max(500).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && ["linkedin.com", "www.linkedin.com"].includes(url.hostname);
    } catch {
      return false;
    }
  }, "Enter a valid HTTPS LinkedIn URL").optional().or(z.literal("")),
  tags: z.string().max(500).optional(),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive", "Archived"]).optional(),
});

export const requirementSchema = z.object({
  contact_id: z.string().uuid("Choose a valid contact"),
  title: z.string().trim().min(3, "Add a requirement title").max(160),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  tags: z.string().max(500).optional(),
  urgency: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["Open", "In Progress", "Matched", "Closed"]),
  follow_up_date: z.string().optional().or(z.literal("")),
});
