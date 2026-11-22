"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const needsDatabaseSetup = error.message.toLowerCase().includes("could not find the table")
    && error.message.toLowerCase().includes("schema cache");

  useEffect(() => {
    console.error("Workspace page failed to load:", error);
  }, [error]);

  return (
    <main className="error-page">
      <span className="empty-icon"><RefreshCw className="size-5" /></span>
      <h1>{needsDatabaseSetup ? "Finish setting up Supabase." : "We couldn’t load your workspace."}</h1>
      <p>
        {needsDatabaseSetup
          ? "The CRM tables are missing. Run supabase/migrations/20261122000000_initial_schema.sql in your Supabase SQL Editor, then try again."
          : "Something went wrong while loading this page. Your data hasn’t been changed."}
      </p>
      <button className="button button-primary" onClick={reset}><RefreshCw className="size-4" /> Try again</button>
    </main>
  );
}
