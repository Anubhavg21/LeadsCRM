"use client";

import Link from "next/link";
import { formatDistance } from "date-fns";
import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  ContactRound,
  FilePlus2,
  GitCompareArrows,
  Plus,
  UserRoundPlus,
} from "lucide-react";
import { ContactAvatar, ContactTypeBadge, RequirementStatusBadge, UrgencyBadge } from "@/components/crm-ui";
import { useCrmData } from "@/components/crm-data-provider";

export function Dashboard() {
  const { contacts, requirements, user, renderedAt } = useCrmData();
  const userName = user.name;
  const referenceDate = new Date(renderedAt);
  const openRequirements = requirements.filter((item) => item.status === "Open" || item.status === "In Progress");
  const highUrgency = openRequirements.filter((item) => item.urgency === "High");
  const latestDate = contacts[0]?.created_at;
  const recentCount = latestDate
    ? contacts.filter((contact) => new Date(contact.created_at).getTime() >= renderedAt - 7 * 86400000).length
    : 0;
  const latestContacts = [...contacts].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);
  const latestRequirements = [...requirements].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);

  const stats = [
    { label: "Total contacts", value: contacts.length.toString(), hint: "Across your network", icon: ContactRound, tone: "stat-green", trend: "In your workspace" },
    { label: "Open requirements", value: openRequirements.length.toString(), hint: "Waiting for a connection", icon: ClipboardList, tone: "stat-blue", trend: "Needs to fill" },
    { label: "High urgency", value: highUrgency.length.toString(), hint: "Worth following up today", icon: CircleAlert, tone: "stat-orange", trend: "Priority" },
    { label: "Added this week", value: recentCount.toString(), hint: "New people in your network", icon: UserRoundPlus, tone: "stat-violet", trend: "Past 7 days" },
  ];

  return (
    <div className="page-stack">
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR NETWORK AT A GLANCE</div>
          <h1>Good morning, {userName.split(/\s+/)[0]}</h1>
          <p className="page-subtitle">A little context goes a long way. Here’s what’s happening across your network.</p>
        </div>
        <div className="welcome-actions">
          <Link className="button button-secondary" href="/contacts"><Plus className="size-4" /> Add a contact</Link>
          <Link className="button button-primary" href="/requirements"><FilePlus2 className="size-4" strokeWidth={1.7} /> Add a need</Link>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(({ label, value, hint, icon: Icon, tone, trend }) => (
          <article className="stat-card" key={label}>
            <div className="stat-top">
              <span className={`stat-icon ${tone}`}><Icon className="size-[18px]" strokeWidth={1.7} /></span>
              <span className="stat-trend"><span />{trend}</span>
            </div>
            <p className="stat-value">{value}</p>
            <div className="stat-bottom"><span className="stat-label">{label}</span><span className="stat-hint">{hint}</span></div>
          </article>
        ))}
      </div>

      <section className="insight-banner">
        <div className="insight-orb"><GitCompareArrows className="size-5" strokeWidth={1.65} /></div>
        <div className="min-w-0 flex-1">
          <p className="insight-kicker">A CONNECTION WORTH MAKING</p>
          <h2>{highUrgency.length ? `${highUrgency[0].contact?.full_name ?? "A contact"} is looking for ${highUrgency[0].title.toLowerCase()}.` : "There are people in your network ready to meet."}</h2>
          <p>We spotted a few overlaps in your network. Take a look at the people who could help.</p>
        </div>
        <Link href="/matching" className="insight-link">Explore matches <ArrowRight className="size-4" /></Link>
        <div className="insight-decoration" aria-hidden="true" />
      </section>

      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div><h2>Recent contacts</h2><p>Your newest connections</p></div>
            <Link href="/contacts" className="subtle-link">View all <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="contact-list">
            {latestContacts.map((contact) => (
              <Link href="/contacts" className="contact-list-row" key={contact.id}>
                <ContactAvatar contact={contact} />
                <span className="contact-row-main">
                  <span className="contact-row-name">{contact.full_name}</span>
                  <span className="contact-row-company">{contact.company_name ?? contact.email ?? "No company listed"}</span>
                </span>
                <ContactTypeBadge type={contact.type} />
                <span className="contact-row-time">{formatDistance(new Date(contact.created_at), referenceDate, { addSuffix: true })}</span>
              </Link>
            ))}
            {!latestContacts.length && <div className="empty-inline">Your next great connection starts here.</div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><h2>Requirements</h2><p>Things your network needs</p></div>
            <Link href="/requirements" className="subtle-link">View all <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="requirement-list">
            {latestRequirements.map((requirement) => (
              <Link href="/requirements" className="requirement-row" key={requirement.id}>
                <span className={`requirement-marker marker-${requirement.urgency.toLowerCase()}`} />
                <span className="requirement-row-main">
                  <span className="requirement-row-title">{requirement.title}</span>
                  <span className="requirement-row-owner">{requirement.contact?.full_name ?? "Contact"}</span>
                </span>
                <UrgencyBadge urgency={requirement.urgency} />
                <RequirementStatusBadge status={requirement.status} />
              </Link>
            ))}
            {!latestRequirements.length && <div className="empty-inline">Add a requirement to start finding connections.</div>}
          </div>
        </section>
      </div>
      <div className="dashboard-footer"><span>Good connections start with knowing what people need.</span><span>Keep it human <span className="footer-heart">♥</span></span></div>
    </div>
  );
}
