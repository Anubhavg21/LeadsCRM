"use client";

import Link from "next/link";
import { ArrowRight, Check, GitCompareArrows, Target } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateRequirementStatusAction } from "@/app/actions";
import { ContactAvatar, ContactTypeBadge, UrgencyBadge } from "@/components/crm-ui";
import { useCrmData } from "@/components/crm-data-provider";
import type { Contact, Requirement } from "@/types/crm";

const stopWords = new Set(["looking", "need", "needs", "for", "the", "and", "with", "from", "able", "want", "help", "partner", "someone", "reliable"]);
const keywords = (text: string) => new Set(
  text.toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !stopWords.has(word)) ?? [],
);

function rankMatches(requirement: Requirement, contacts: Contact[]) {
  const need = keywords([requirement.title, requirement.description, requirement.category, ...requirement.tags].filter(Boolean).join(" "));
  return contacts
    .filter((contact) =>
      contact.id !== requirement.contact_id &&
      contact.status === "Active" &&
      contact.type !== "Buyer",
    )
    .map((contact) => {
      const profile = keywords([contact.company_name, contact.type, contact.notes, ...contact.tags].filter(Boolean).join(" "));
      const overlap = [...need].filter((word) => profile.has(word));
      const exactTagCount = requirement.tags.filter((tag) => contact.tags.some((candidate) => candidate.toLowerCase() === tag.toLowerCase())).length;
      const score = Math.min(98, Math.round((exactTagCount * 32 + overlap.length * 18) * 1.15));
      return { contact, overlap, exactTagCount, score };
    })
    .filter((match) => match.score >= 18)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function MatchingView() {
  const { contacts, requirements } = useCrmData();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const urgencyRank = { High: 0, Medium: 1, Low: 2 };
  const opportunities = requirements
    .filter((requirement) => requirement.status === "Open" || requirement.status === "In Progress")
    .map((requirement) => ({ requirement, matches: rankMatches(requirement, contacts) }))
    .sort((a, b) => b.matches.length - a.matches.length || urgencyRank[a.requirement.urgency] - urgencyRank[b.requirement.urgency]);

  function makeMatch(requirement: Requirement, contactId: string) {
    if (!contactId) {
      toast.error("Choose a contact to introduce.");
      return;
    }
    const contact = contacts.find((item) => item.id === contactId);
    startTransition(async () => {
      const result = await updateRequirementStatusAction(requirement.id, "Matched", contactId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Connection recorded${contact ? ` with ${contact.full_name}` : ""}.`);
      router.refresh();
    });
  }

  return (
    <div className="page-stack">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> A GOOD INTRO BEGINS WITH A NEED</div>
          <h1>Potential introductions</h1>
          <p className="page-subtitle">Find the people in your network who can move a conversation forward.</p>
        </div>
        <Link href="/requirements" className="button button-secondary">View requirements <ArrowRight className="size-4" /></Link>
      </div>
      <div className="matching-intro"><div className="matching-intro-icon"><Target className="size-5" /></div><div><strong>How matches work</strong><p>We look for overlapping tags and keywords between open needs and active contacts. Treat these as thoughtful suggestions, not guarantees.</p></div><span className="match-count-pill">{opportunities.reduce((total, item) => total + item.matches.length, 0)} possible connections</span></div>
      <div className="match-opportunities">
        <AnimatePresence mode="popLayout">
        {opportunities.map(({ requirement, matches }, needIndex) => (
          <motion.section
            className="match-need-card"
            key={requirement.id}
            initial={{ opacity: 0, y: 9 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, delay: needIndex * 0.045 }}
          >
            <div className="match-need-side"><span className={`match-need-icon ${requirement.urgency === "High" ? "match-need-hot" : ""}`}><Target className="size-4" strokeWidth={1.7} /></span><span className="match-need-caption">LOOKING FOR</span><UrgencyBadge urgency={requirement.urgency} /></div>
            <div className="match-need-content">
              <div className="match-need-heading"><div><h2>{requirement.title}</h2><p>{requirement.contact?.full_name}{requirement.contact?.company_name ? ` · ${requirement.contact.company_name}` : ""}</p></div><span className="match-results-count">{matches.length} {matches.length === 1 ? "match" : "matches"}</span></div>
              <p className="match-need-description">{requirement.description || "No extra details. Use tags to add context to this requirement."}</p>
              <div className="match-need-tags">{requirement.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}</div>
              {matches.length ? (
                <div className="match-candidates">
                  {matches.map(({ contact, overlap, exactTagCount, score }, matchIndex) => (
                    <motion.article
                      className="candidate-card"
                      key={contact.id}
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: needIndex * 0.045 + matchIndex * 0.035 }}
                    >
                      <div className="candidate-main"><ContactAvatar contact={contact} /><span className="candidate-copy"><strong>{contact.full_name}</strong><span>{contact.company_name ?? contact.type}</span></span><ContactTypeBadge type={contact.type} /></div>
                      <div className="candidate-fit"><span className="fit-meter"><span style={{ width: `${score}%` }} /></span><strong>{score >= 70 ? "Strong overlap" : score >= 40 ? "Some overlap" : "Keyword overlap"}</strong></div>
                      <p className="candidate-reason">{exactTagCount ? `${exactTagCount} shared ${exactTagCount === 1 ? "tag" : "tags"}` : "Keyword overlap"}{overlap.length ? ` · ${overlap.slice(0, 3).join(", ")}` : ""}</p>
                      <button className="button button-match candidate-action" disabled={pending} onClick={() => makeMatch(requirement, contact.id)}><Check className="size-3.5" /> Record match</button>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="no-match-tip"><span>Not seeing the right person?</span><p>Add more tags or details to the requirement, or grow your network with contacts in this space.</p><Link href="/contacts">Explore contacts <ArrowRight className="size-3.5" /></Link></div>
              )}
            </div>
          </motion.section>
        ))}
        </AnimatePresence>
        {!opportunities.length && <div className="empty-state"><span className="empty-icon"><GitCompareArrows className="size-5" /></span><h2>Nothing to match yet</h2><p>Add an open requirement and we’ll look for connections across your network.</p><Link href="/requirements" className="button button-primary">Add a requirement <ArrowRight className="size-4" /></Link></div>}
      </div>
    </div>
  );
}
