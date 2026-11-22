"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Grid2X2,
  List,
  Mail,
  MapPin,
  Plus,
  Search,
  Archive,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { archiveContactAction, createContactAction, updateContactAction } from "@/app/actions";
import { ContactAvatar, ContactTypeBadge, RequirementStatusBadge, UrgencyBadge } from "@/components/crm-ui";
import { useCrmData } from "@/components/crm-data-provider";
import { contactSchema } from "@/lib/validation";
import type { Contact } from "@/types/crm";

type ContactFormValues = z.input<typeof contactSchema>;

export function ContactsView() {
  const { contacts, requirements } = useCrmData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [tagFilter, setTagFilter] = useState("All tags");
  const [locationFilter, setLocationFilter] = useState("All locations");
  const [layout, setLayout] = useState<"table" | "grid">("table");
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { full_name: "", company_name: "", type: "Buyer", email: "", phone: "", city: "", country: "", linkedin_url: "", tags: "", notes: "", status: "Active" },
  });

  const visibleContacts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesSearch = !needle || [
        contact.full_name, contact.company_name, contact.email, contact.phone,
        contact.city, contact.country, ...contact.tags,
      ].filter(Boolean).join(" ").toLowerCase().includes(needle);
      return matchesSearch &&
        (typeFilter === "All types" || contact.type === typeFilter) &&
        (statusFilter === "All status" || contact.status === statusFilter) &&
        (tagFilter === "All tags" || contact.tags.includes(tagFilter)) &&
        (locationFilter === "All locations" || [contact.city, contact.country].filter(Boolean).join(", ") === locationFilter);
    });
  }, [contacts, locationFilter, query, statusFilter, tagFilter, typeFilter]);
  const tags = [...new Set(contacts.flatMap((contact) => contact.tags))].sort();
  const locations = [...new Set(contacts.map((contact) => [contact.city, contact.country].filter(Boolean).join(", ")).filter(Boolean))].sort();

  function openContactForm(contact?: Contact) {
    setSelected(null);
    setEditing(contact ?? null);
    reset(contact ? {
      full_name: contact.full_name,
      company_name: contact.company_name ?? "",
      type: contact.type,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      city: contact.city ?? "",
      country: contact.country ?? "",
      linkedin_url: contact.linkedin_url ?? "",
      tags: contact.tags.join(", "),
      notes: contact.notes ?? "",
      status: contact.status,
    } : {
      full_name: "", company_name: "", type: "Buyer", email: "", phone: "",
      city: "", country: "", linkedin_url: "", tags: "", notes: "", status: "Active",
    });
    setAddOpen(true);
  }

  function submitContact(values: ContactFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined) formData.set(key, String(value));
    });
    startTransition(async () => {
      const result = editing
        ? await updateContactAction(editing.id, formData)
        : await createContactAction(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Contact details updated." : "Contact added to your network.");
      setAddOpen(false);
      setEditing(null);
      router.refresh();
    });
  }

  function archiveContact() {
    if (!selected) return;
    startTransition(async () => {
      const result = await archiveContactAction(selected.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Contact archived.");
      setSelected(null);
      router.refresh();
    });
  }

  const contactRequirements = selected ? requirements.filter((item) => item.contact_id === selected.id) : [];

  return (
    <div className="page-stack">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR NETWORK</div>
          <h1>Contacts <span className="heading-count">{contacts.length}</span></h1>
          <p className="page-subtitle">A thoughtful rolodex of people worth knowing.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => openContactForm()}><Plus className="size-4" /> Add contact</button>
      </div>

      <div className="toolbar">
        <label className="filter-search">
          <Search className="size-4" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, companies, tags..." />
          {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X className="size-3.5" /></button>}
        </label>
        <label className="select-wrap">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by contact type">
            <option>All types</option><option>Buyer</option><option>Seller</option><option>Founder</option><option>Agency</option><option>Other</option>
          </select><ChevronDown className="size-3.5" />
        </label>
        <label className="select-wrap">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            <option>All status</option><option>Active</option><option>Inactive</option><option>Archived</option>
          </select><ChevronDown className="size-3.5" />
        </label>
        <label className="select-wrap tag-filter">
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} aria-label="Filter by tag">
            <option>All tags</option>{tags.map((tag) => <option key={tag}>{tag}</option>)}
          </select><ChevronDown className="size-3.5" />
        </label>
        <label className="select-wrap location-filter">
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} aria-label="Filter by country">
            <option>All locations</option>{locations.map((location) => <option key={location}>{location}</option>)}
          </select><ChevronDown className="size-3.5" />
        </label>
        <div className="view-toggle" aria-label="Contact layout">
          <button type="button" onClick={() => setLayout("table")} className={layout === "table" ? "view-toggle-active" : ""} aria-label="Table view"><List className="size-4" /></button>
          <button type="button" onClick={() => setLayout("grid")} className={layout === "grid" ? "view-toggle-active" : ""} aria-label="Card view"><Grid2X2 className="size-4" /></button>
        </div>
      </div>
      <div className="results-caption">Showing <strong>{visibleContacts.length}</strong> of {contacts.length} people</div>

      {visibleContacts.length ? layout === "table" ? (
        <div className="table-card">
          <div className="contact-table contact-table-header">
            <span>Person</span><span>Type</span><span>Location</span><span>Tags</span><span>Added</span><span />
          </div>
          {visibleContacts.map((contact, index) => (
            <motion.button
              type="button"
              className="contact-table contact-table-row"
              key={contact.id}
              onClick={() => setSelected(contact)}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ x: 2 }}
              transition={{ duration: 0.17, delay: Math.min(index, 6) * 0.025 }}
            >
              <span className="table-person">
                <ContactAvatar contact={contact} />
                <span className="min-w-0"><span className="table-primary">{contact.full_name}</span><span className="table-secondary">{contact.company_name ?? contact.email ?? "No company listed"}</span></span>
              </span>
              <span><ContactTypeBadge type={contact.type} /></span>
              <span className="table-location"><MapPin className="size-3.5" />{[contact.city, contact.country].filter(Boolean).join(", ") || "—"}</span>
              <span className="tag-stack">{contact.tags.slice(0, 2).map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}{contact.tags.length > 2 && <span className="tag-more">+{contact.tags.length - 2}</span>}</span>
              <span className="table-date">{new Date(contact.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span>
              <span className="row-chevron">↗</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="contact-grid">
          {visibleContacts.map((contact, index) => (
            <motion.button
              type="button"
              className="contact-card"
              key={contact.id}
              onClick={() => setSelected(contact)}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18, delay: Math.min(index, 6) * 0.025 }}
            >
              <div className="contact-card-top"><ContactAvatar contact={contact} size="lg" /><span className="row-chevron">↗</span></div>
              <h3>{contact.full_name}</h3>
              <p className="contact-card-company"><Building2 className="size-3.5" />{contact.company_name ?? "Independent"}</p>
              <ContactTypeBadge type={contact.type} />
              <div className="contact-card-tags">{contact.tags.slice(0, 3).map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}</div>
              <p className="contact-card-location"><MapPin className="size-3.5" />{[contact.city, contact.country].filter(Boolean).join(", ") || "Location not set"}</p>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon"><Search className="size-5" /></span>
          <h2>No people found</h2>
          <p>{query ? "Try another name, company, or tag." : "Add your first contact to start building your network."}</p>
          {!query && <button className="button button-primary" onClick={() => openContactForm()}><Plus className="size-4" /> Add contact</button>}
        </div>
      )}

      <AnimatePresence>
      {addOpen && (
        <motion.div
          className="modal-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setAddOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.section
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-contact-title"
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 7, scale: 0.99 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="modal-heading"><div><p className="eyebrow">{editing ? "KEEP YOUR NETWORK CURRENT" : "GROW YOUR NETWORK"}</p><h2 id="add-contact-title">{editing ? "Edit contact" : "Add a contact"}</h2></div><button className="icon-button" onClick={() => setAddOpen(false)} aria-label="Close"><X className="size-4" /></button></div>
            <form onSubmit={handleSubmit(submitContact)} className="form-grid">
              <label className="field-label field-span-2">Full name <span>*</span><input {...register("full_name")} placeholder="e.g. Maya Chen" aria-invalid={Boolean(errors.full_name)} />{errors.full_name && <small className="field-error">{errors.full_name.message}</small>}</label>
              <label className="field-label">Company<input {...register("company_name")} placeholder="Company name" /></label>
              <label className="field-label">Type<select {...register("type")}><option>Buyer</option><option>Seller</option><option>Founder</option><option>Agency</option><option>Other</option></select></label>
              <label className="field-label">Email<input {...register("email")} type="email" placeholder="name@company.com" aria-invalid={Boolean(errors.email)} />{errors.email && <small className="field-error">{errors.email.message}</small>}</label>
              <label className="field-label">Phone / WhatsApp<input {...register("phone")} placeholder="+1 (555) 000-0000" /></label>
              <label className="field-label">City<input {...register("city")} placeholder="City" /></label>
              <label className="field-label">Country<input {...register("country")} placeholder="Country" /></label>
              <label className="field-label field-span-2">LinkedIn URL<input {...register("linkedin_url")} type="url" placeholder="https://linkedin.com/in/..." aria-invalid={Boolean(errors.linkedin_url)} />{errors.linkedin_url && <small className="field-error">{errors.linkedin_url.message}</small>}</label>
              {editing && <label className="field-label field-span-2">Status<select {...register("status")}><option>Active</option><option>Inactive</option><option>Archived</option></select></label>}
              <label className="field-label field-span-2">Tags <small>Separate with commas</small><input {...register("tags")} placeholder="e.g. agriculture, export, sourcing" /></label>
              <label className="field-label field-span-2">Notes<textarea {...register("notes")} rows={3} placeholder="A little context to help you remember..." /></label>
              <div className="form-actions field-span-2"><button type="button" className="button button-secondary" onClick={() => setAddOpen(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={pending}>{pending ? "Saving..." : <>{editing ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}{editing ? "Save changes" : "Save contact"}</>}</button></div>
            </form>
          </motion.section>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {selected && (
        <motion.div
          className="modal-backdrop drawer-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.section
            className="contact-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-detail-title"
            initial={{ x: 24 }}
            animate={{ x: 0 }}
            exit={{ x: 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="drawer-top"><span className="eyebrow">CONTACT PROFILE</span><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close"><X className="size-4" /></button></div>
            <div className="drawer-profile"><ContactAvatar contact={selected} size="lg" /><div><h2 id="contact-detail-title">{selected.full_name}</h2><p>{selected.company_name ?? "Independent"}</p></div></div>
            <div className="drawer-type-row"><ContactTypeBadge type={selected.type} /><span className={`contact-status contact-status-${selected.status.toLowerCase()}`}>{selected.status}</span></div>
            <div className="drawer-section"><h3>Contact details</h3>{selected.email && <p><Mail className="size-4" />{selected.email}</p>}{selected.phone && <p>{selected.phone}</p>}{selected.linkedin_url && <p><a className="linkedin-link" href={selected.linkedin_url} target="_blank" rel="noopener noreferrer">LinkedIn profile ↗</a></p>}<p><MapPin className="size-4" />{[selected.city, selected.country].filter(Boolean).join(", ") || "Location not set"}</p></div>
            <div className="drawer-section"><h3>Tags</h3><div className="tag-stack">{selected.tags.length ? selected.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>) : <span className="table-secondary">No tags yet</span>}</div></div>
            <div className="drawer-section"><h3>Notes</h3><p className="drawer-notes">{selected.notes || "No notes added yet."}</p></div>
            <div className="drawer-section"><h3>Requirements <span className="heading-count">{contactRequirements.length}</span></h3>{contactRequirements.length ? contactRequirements.map((item) => <div className="drawer-requirement" key={item.id}><strong>{item.title}</strong><div><UrgencyBadge urgency={item.urgency} /><RequirementStatusBadge status={item.status} /></div></div>) : <p className="table-secondary">No requirements linked yet.</p>}</div>
            <div className="drawer-section"><h3>Activity</h3><div className="activity-timeline"><div className="activity-item"><span className="activity-dot" /><span><strong>Added to your network</strong><small>{new Date(selected.created_at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</small></span></div>{contactRequirements.map((item) => <div className="activity-item" key={`activity-${item.id}`}><span className="activity-dot activity-dot-need" /><span><strong>Need noted: {item.title}</strong><small>{new Date(item.created_at).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</small></span></div>)}</div></div>
            <div className="drawer-footer"><span>Added {new Date(selected.created_at).toLocaleDateString()}</span><div className="drawer-actions"><button className="button button-quiet" onClick={() => openContactForm(selected)} disabled={pending}><Pencil className="size-3.5" /> Edit</button>{selected.status !== "Archived" && <button className="button button-quiet button-archive" onClick={archiveContact} disabled={pending}><Archive className="size-3.5" /> Archive</button>}</div></div>
          </motion.section>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
