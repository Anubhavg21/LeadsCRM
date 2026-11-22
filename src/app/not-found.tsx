import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="error-page">
      <span className="empty-icon">404</span>
      <h1>This page isn’t here.</h1>
      <p>The link may be outdated, or the page may have moved. Head back to your network and keep the conversation going.</p>
      <Link href="/" className="button button-primary"><ArrowLeft className="size-4" /> Back to overview</Link>
    </main>
  );
}
