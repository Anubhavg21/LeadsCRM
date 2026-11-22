import { CircleCheck, CircleDashed, CircleDot, Clock3 } from "lucide-react";
import type { Contact, Requirement } from "@/types/crm";

export function ContactAvatar({ contact, size = "md" }: { contact: Pick<Contact, "full_name" | "type">; size?: "sm" | "md" | "lg" }) {
  const initials = contact.full_name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors: Record<Contact["type"], string> = {
    Buyer: "avatar-sage",
    Seller: "avatar-peach",
    Founder: "avatar-lavender",
    Agency: "avatar-blue",
    Other: "avatar-gray",
  };
  return <span className={`contact-avatar ${colors[contact.type]} avatar-${size}`}>{initials}</span>;
}

export function ContactTypeBadge({ type }: { type: Contact["type"] }) {
  return <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>;
}

export function RequirementStatusBadge({ status }: { status: Requirement["status"] }) {
  const Icon = status === "Matched" ? CircleCheck : status === "In Progress" ? Clock3 : status === "Closed" ? CircleDashed : CircleDot;
  return <span className={`status-badge status-${status.toLowerCase().replace(" ", "-")}`}><Icon className="size-3.5" />{status}</span>;
}

export function UrgencyBadge({ urgency }: { urgency: Requirement["urgency"] }) {
  return <span className={`urgency-badge urgency-${urgency.toLowerCase()}`}><span />{urgency}</span>;
}
