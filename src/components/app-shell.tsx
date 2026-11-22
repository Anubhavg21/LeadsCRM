"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookUser,
  ClipboardList,
  Command,
  ContactRound,
  GitCompareArrows,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ThemeToggle } from "@/components/theme-toggle";
import { CrmDataProvider } from "@/components/crm-data-provider";
import type { Contact, Requirement } from "@/types/crm";
import { toast } from "sonner";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/requirements", label: "Requirements", icon: ClipboardList },
  { href: "/matching", label: "Introductions", icon: GitCompareArrows },
];

export function AppShell({
  children,
  contacts,
  requirements,
  user,
  renderedAt,
}: {
  children: React.ReactNode;
  contacts: Contact[];
  requirements: Requirement[];
  user: { name: string; email: string };
  renderedAt: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const userInitials = user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const crmData = useMemo(() => ({ contacts, requirements, user, renderedAt }), [contacts, requirements, user, renderedAt]);

  function prefetchRoute(href: string) {
    if (pathname !== href) router.prefetch(href);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
      if (event.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const contactResults = contacts
      .filter((contact) =>
        [contact.full_name, contact.company_name, contact.email, ...contact.tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 5)
      .map((contact) => ({
        title: contact.full_name,
        detail: contact.company_name ?? `${contact.type} contact`,
        href: "/contacts",
        type: "Contact",
      }));
    const requirementResults = requirements
      .filter((requirement) =>
        [requirement.title, requirement.description, requirement.category, ...requirement.tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 5)
      .map((requirement) => ({
        title: requirement.title,
        detail: requirement.contact?.full_name ?? "Requirement",
        href: "/requirements",
        type: "Requirement",
      }));
    return [...contactResults, ...requirementResults].slice(0, 8);
  }, [contacts, query, requirements]);

  async function signOut() {
    if (isSupabaseConfigured) {
      const { error } = await createClient().auth.signOut();
      if (error) {
        toast.error("Could not sign out. Please try again.");
        return;
      }
      window.location.assign("/login");
      return;
    }
    toast.info("This preview is not connected to an account.");
  }

  return (
    <div className="app-frame">
      {sidebarOpen && (
        <button
          type="button"
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <Link href="/" className="brand-home" onClick={() => setSidebarOpen(false)}>
            <span className="brand-mark"><BookUser className="size-[18px]" strokeWidth={1.7} /></span>
            <span className="brand-name">common<span>room</span></span>
          </Link>
          <button
            type="button"
            className="icon-button sidebar-close-button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">W</div>
          <div className="min-w-0 flex-1">
            <p className="workspace-name">Workspace</p>
            <p className="workspace-plan">Personal CRM</p>
          </div>
          <ArrowUpRight className="size-4 text-muted" />
        </div>

        <p className="nav-caption">Workspace</p>
        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                href={href}
                key={href}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
                onClick={() => setSidebarOpen(false)}
                onMouseEnter={() => prefetchRoute(href)}
                onFocus={() => prefetchRoute(href)}
              >
                <Icon className="size-[17px]" strokeWidth={1.8} />
                <span>{label}</span>
                {label === "Requirements" && (
                  <span className="nav-count">{requirements.filter((item) => item.status === "Open").length}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="match-promo">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="promo-icon"><GitCompareArrows className="size-4" strokeWidth={1.7} /></span>
              Make the right intro
            </div>
            <p>Find the people who can make it happen.</p>
            <Link href="/matching" className="promo-link" onClick={() => setSidebarOpen(false)}>
              Explore introductions <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <button type="button" className="profile-row" onClick={signOut}>
            <div className="profile-avatar">{userInitials}</div>
            <div className="min-w-0 flex-1 text-left">
              <p className="profile-name">{user.name}</p>
              <p className="profile-email">{user.email || (isSupabaseConfigured ? "Personal workspace" : "Preview workspace")}</p>
            </div>
            <LogOut className="size-4 text-muted" />
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-menu-button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="global-search"
            aria-label="Search contacts and requirements"
          >
            <Search className="size-4" />
            <span>Search contacts, requirements...</span>
            <kbd><Command className="size-3" /> K</kbd>
          </button>
          <div className="topbar-actions">
            {!isSupabaseConfigured && <span className="preview-pill"><span /> Preview mode</span>}
            <ThemeToggle />
            <div className="topbar-avatar">{userInitials}</div>
          </div>
        </header>
        {!isSupabaseConfigured && (
          <div className="preview-notice">
            <Info className="size-3.5 shrink-0" />
            You’re exploring a preview with sample data. Connect Supabase to save your own contacts and requirements.
            <Link href="/login">Set up workspace <ArrowUpRight className="size-3" /></Link>
          </div>
        )}
        <main className="page-content">
          <CrmDataProvider value={crmData}>
            <motion.div
              key={pathname}
              className="route-transition"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </CrmDataProvider>
        </main>
      </div>

      <AnimatePresence>
        {searchOpen && (
        <motion.div
          className="command-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
        >
          <motion.section
            className="command-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.99 }}
            transition={{ duration: 0.17, ease: "easeOut" }}
          >
            <div className="command-input-row">
              <Search className="size-5 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people, companies, needs..."
                aria-label="Search"
              />
              <kbd>ESC</kbd>
            </div>
            {query.trim() ? (
              <div className="command-results">
                {results.length ? results.map((item, index) => (
                  <Link
                    key={`${item.type}-${item.title}-${index}`}
                    href={item.href}
                    className="command-result"
                    onClick={() => setSearchOpen(false)}
                  >
                    <span className="command-result-icon">{item.type === "Contact" ? <ContactRound className="size-4" /> : <ClipboardList className="size-4" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                      <span className="block truncate text-xs text-muted">{item.detail}</span>
                    </span>
                    <span className="command-type">{item.type}</span>
                  </Link>
                )) : <p className="command-empty">No matches found. Try a different name or keyword.</p>}
              </div>
            ) : (
              <div className="command-hint">
                <span>QUICK LINKS</span>
                {navigation.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setSearchOpen(false)}>
                    <Icon className="size-4" /> {label}<span>↵</span>
                  </Link>
                ))}
                <p>Search across your contacts and requirements as you type.</p>
              </div>
            )}
          </motion.section>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
