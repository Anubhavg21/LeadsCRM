"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookUser, Database, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    if (!isSupabaseConfigured) {
      toast.error("Supabase not configured. Check .env.local.");
      console.error("Supabase config missing.");
      return;
    }
    setPending(true);
    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      const fullName = String(formData.get("full_name") ?? "").trim();

      const supabase = createClient();
      const response =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          });

      console.log("Supabase response", response);

      if (response.error) {
        console.error("Supabase error", response.error);
        toast.error(response.error.message);
        return;
      }

      // For sign‑up, Supabase may not create a session immediately
      if (mode === "signup" && !response.data?.session) {
        toast.success(
          "Account created. Check your email to confirm your address."
        );
        return;
      }

      toast.success(mode === "signin" ? "Welcome back." : "Your workspace is ready.");
      router.replace("/");
      router.refresh();
    } catch (e: any) {
      console.error("Unexpected error", e);
      toast.error(e?.message ?? "Unexpected error");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one" aria-hidden="true" />
      <div className="auth-decoration auth-decoration-two" aria-hidden="true" />
      <div className="auth-frame">
        <Link href="/" className="auth-brand">
          <span className="brand-mark"><BookUser className="size-[18px]" strokeWidth={1.7} /></span>
          <span className="brand-name">common<span>room</span></span>
        </Link>
        <section className="auth-card">
          <div className="auth-illustration">
            <div className="auth-story">
              <p className="auth-story-label">A PRIVATE RELATIONSHIP CRM</p>
              <h2>Keep the important connections close.</h2>
              <p>People, requirements, and next steps—together in one considered workspace.</p>
            </div>
            <div className="auth-art" aria-hidden="true">
              <div className="auth-orbit orbit-one" />
              <div className="auth-orbit orbit-two" />
              <span className="auth-node auth-node-one" />
              <span className="auth-node auth-node-two" />
              <span className="auth-center"><BookUser className="size-7" strokeWidth={1.6} /></span>
            </div>
            <span className="auth-caption">GOOD PEOPLE, CONNECTED</span>
          </div>
          <div className="auth-content">
            <Link className="back-home" href="/"><ArrowLeft className="size-3.5" /> Back to preview</Link>
            <p className="eyebrow"><span className="eyebrow-dot" /> YOUR NETWORK, IN GOOD COMPANY</p>
            <h1>{mode === "signin" ? "Welcome back." : "Build your room."}</h1>
            <p className="auth-subtitle">{mode === "signin" ? "Sign in to pick up where your next great connection starts." : "Create a private workspace for your people and opportunities."}</p>
            {isSupabaseConfigured ? (

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(new FormData(e.currentTarget));
                }}
                className="auth-fields"
              >
                {mode === "signup" && (
                  <label className="field-label">
                    Your name
                    <span className="auth-input-wrap">
                      <input
                        name="full_name"
                        autoComplete="name"
                        required
                        placeholder="Alex Morgan"
                      />
                    </span>
                  </label>
                )}

                <label className="field-label">
                  Email address
                  <span className="auth-input-wrap">
                    <Mail className="size-4" />
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                    />
                  </span>
                </label>

                <label className="field-label">
                  Password
                  <span className="auth-input-wrap">
                    <LockKeyhole className="size-4" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete={
                        mode === "signin" ? "current-password" : "new-password"
                      }
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </span>
                </label>

                <button
                  className="button button-primary auth-submit"
                  type="submit"
                  disabled={pending}
                >
                  {pending
                    ? "One moment..."
                    : mode === "signin"
                      ? "Sign in to your workspace"
                      : "Create your workspace"}
                  <ArrowLeft className="size-4 rotate-180" />
                </button>
              </form>

            ) : (
              <div className="setup-callout"><Database className="size-4" strokeWidth={1.7} /><div><strong>Connect your Supabase project</strong><p>Add your project URL and anon key to <code>.env.local</code>, then restart the app to enable secure sign-in.</p><code>NEXT_PUBLIC_SUPABASE_URL<br />NEXT_PUBLIC_SUPABASE_ANON_KEY</code></div></div>
            )}
            {isSupabaseConfigured && <p className="auth-switch">{mode === "signin" ? "New to Commonroom?" : "Already have a workspace?"}<button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p>}
            <p className="auth-privacy">Your workspace is private. Your data stays yours.</p>
          </div>
        </section>
      </div>
      <p className="auth-footer">Built for better business relationships</p>
    </main>
  );
}
