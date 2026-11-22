"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, CalendarDays, ChevronDown, Link2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { archiveRequirementAction, createRequirementAction, updateRequirementStatusAction } from "@/app/actions";
import { ContactAvatar, RequirementStatusBadge, UrgencyBadge } from "@/components/crm-ui";
import { useCrmData } from "@/components/crm-data-provider";
import { requirementSchema } from "@/lib/validation";
import type { Requirement } from "@/types/crm";

type RequirementFormValues = z.input<typeof requirementSchema>;

export function RequirementsView() {
  const { requirements, contacts } = useCrmData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All requirements");
  const [addOpen, setAddOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementSchema),
    defaultValues: { contact_id: "", title: "", description: "", category: "", tags: "", urgency: "Medium", status: "Open", follow_up_date: "" },
  });
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requirements.filter((item) => {
      const matches = !needle || [item.title, item.description, item.category, item.contact?.full_name, ...item.tags]
        .filter(Boolean).join(" ").toLowerCase().includes(needle);
      return matches && (statusFilter === "All requirements" || item.status === statusFilter);
    });
  }, [query, requirements, statusFilter]);

  function submitRequirement(values: RequirementFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined) formData.set(key, String(value));
    });
    startTransition(async () => {
      const result = await createRequirementAction(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Requirement added.");
      setAddOpen(false);
      router.refresh();
    });
  }

  function markMatched(requirement: Requirement) {
    const candidateId = selectedCandidates[requirement.id];
    startTransition(async () => {
      const result = await updateRequirementStatusAction(requirement.id, "Matched", candidateId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const candidate = contacts.find((contact) => contact.id === candidateId);
      toast.success(candidate ? `Matched with ${candidate.full_name}.` : "Requirement marked as matched.");
      router.refresh();
    });
  }

  function archiveRequirement(requirement: Requirement) {
    startTransition(async () => {
      const result = await archiveRequirementAction(requirement.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Requirement archived.");
      router.refresh();
    });
  }

  function openRequirementForm() {
    reset({ contact_id: "", title: "", description: "", category: "", tags: "", urgency: "Medium", status: "Open", follow_up_date: "" });
    setAddOpen(true);
  }

  return (
    <div className="page-stack">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> WHAT YOUR NETWORK NEEDS</div>
          <h1>Requirements <span className="heading-count">{requirements.length}</span></h1>
          <p className="page-subtitle">Keep track of opportunities and the people looking for them.</p>
        </div>
        <button className="button button-primary" type="button" onClick={openRequirementForm}><Plus className="size-4" /> Add requirement</button>
      </div>
      <div className="toolbar">
        <label className="filter-search"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requirements, keywords, people..." />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X className="size-3.5" /></button>}</label>
        <label className="select-wrap"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter requirements by status"><option>All requirements</option><option>Open</option><option>In Progress</option><option>Matched</option><option>Closed</option></select><ChevronDown className="size-3.5" /></label>
      </div>
      <div className="results-caption">Showing <strong>{visible.length}</strong> of {requirements.length} requirements</div>

      <div className="requirements-board">
        {visible.map((item) => {
          const owner = contacts.find((contact) => contact.id === item.contact_id) ?? item.contact;
          return (
            <article className="requirement-card" key={item.id}>
              <div className={`requirement-accent accent-${item.urgency.toLowerCase()}`} />
              <div className="requirement-card-main">
                <div className="requirement-title-line"><h2>{item.title}</h2><UrgencyBadge urgency={item.urgency} /></div>
                <p className="requirement-description">{item.description || "No description added yet."}</p>
                <div className="requirement-tags">{item.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}{item.category && !item.tags.includes(item.category) && <span className="tag-chip tag-category">{item.category}</span>}</div>
                <div className="requirement-meta">
                  {owner && <span className="owner-mini"><ContactAvatar contact={owner} size="sm" />{owner.full_name}<span className="owner-company">{owner.company_name}</span></span>}
                  {item.follow_up_date && <span className="followup-mini"><CalendarDays className="size-3.5" /> Follow up {new Date(`${item.follow_up_date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span>}
                </div>
              </div>
              <div className="requirement-card-aside">
                <RequirementStatusBadge status={item.status} />
                <span className="requirement-created">{new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span>
                {(item.status === "Open" || item.status === "In Progress") && <>
                  <label className="match-contact-select"><span>Matched with (optional)</span><select value={selectedCandidates[item.id] ?? ""} onChange={(event) => setSelectedCandidates((state) => ({ ...state, [item.id]: event.target.value }))}><option value="">Not linked</option>{contacts.filter((contact) => contact.id !== item.contact_id && contact.status === "Active").map((contact) => <option value={contact.id} key={contact.id}>{contact.full_name}</option>)}</select></label>
                  <button className="button button-match" disabled={pending} onClick={() => markMatched(item)}><Link2 className="size-3.5" strokeWidth={1.7} /> Mark matched</button>
                </>}
                <button className="button icon-button requirement-archive" title="Archive requirement" aria-label="Archive requirement" disabled={pending} onClick={() => archiveRequirement(item)}><Archive className="size-3.5" /></button>
              </div>
            </article>
          );
        })}
        {!visible.length && <div className="empty-state"><span className="empty-icon"><Search className="size-5" /></span><h2>No requirements found</h2><p>{query ? "Try another search or filter." : "Create a requirement to make the next introduction."}</p><button className="button button-primary" onClick={openRequirementForm}><Plus className="size-4" /> Add requirement</button></div>}
      </div>

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
            aria-labelledby="add-requirement-title"
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 7, scale: 0.99 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="modal-heading"><div><p className="eyebrow">CAPTURE AN OPPORTUNITY</p><h2 id="add-requirement-title">Add a requirement</h2></div><button className="icon-button" onClick={() => setAddOpen(false)} aria-label="Close"><X className="size-4" /></button></div>
            {contacts.length ? <form onSubmit={handleSubmit(submitRequirement)} className="form-grid">
              <label className="field-label field-span-2">Requirement title <span>*</span><input {...register("title")} placeholder="e.g. Looking for a soybean supplier" aria-invalid={Boolean(errors.title)} />{errors.title && <small className="field-error">{errors.title.message}</small>}</label>
              <label className="field-label field-span-2">Contact <span>*</span><select {...register("contact_id")}><option value="">Choose a contact</option>{contacts.filter((contact) => contact.status === "Active").map((contact) => <option value={contact.id} key={contact.id}>{contact.full_name}{contact.company_name ? ` · ${contact.company_name}` : ""}</option>)}</select>{errors.contact_id && <small className="field-error">{errors.contact_id.message}</small>}</label>
              <label className="field-label">Category<input {...register("category")} placeholder="e.g. Ingredients" /></label>
              <label className="field-label">Urgency<select {...register("urgency")}><option>Low</option><option>Medium</option><option>High</option></select></label>
              <label className="field-label">Status<select {...register("status")}><option>Open</option><option>In Progress</option><option>Matched</option><option>Closed</option></select></label>
              <label className="field-label">Follow-up date<input {...register("follow_up_date")} type="date" /></label>
              <label className="field-label field-span-2">Description<textarea {...register("description")} rows={3} placeholder="What are they looking for? Add helpful context..." /></label>
              <label className="field-label field-span-2">Keywords and tags <small>Separate with commas</small><input {...register("tags")} placeholder="e.g. soybean, organic, agriculture" /></label>
              <div className="form-actions field-span-2"><button type="button" className="button button-secondary" onClick={() => setAddOpen(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={pending}>{pending ? "Saving..." : <><Plus className="size-4" /> Save requirement</>}</button></div>
            </form> : <div className="empty-state compact-empty"><p>Add a contact first so you can link a requirement to them.</p><button className="button button-secondary" onClick={() => setAddOpen(false)}>Got it</button></div>}
          </motion.section>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
