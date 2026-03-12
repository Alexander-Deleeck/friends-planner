"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RequestResponse = {
  loginUrl: string;
  expiresAt: string;
  user: { id: number; email: string; displayName: string };
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("Requesting link...");
    setError(null);
    setLoginUrl(null);

    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Request failed");
      }

      const body = (await res.json()) as RequestResponse;
      setLoginUrl(body.loginUrl);
      setStatus(`Link valid until ${new Date(body.expiresAt).toLocaleString()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setStatus(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Login</h1>
      <p className="text-sm text-muted-foreground">
        Enter your email to request a magic link. In development, the login URL
        will be shown below for copy/paste.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <Button
          type="submit"
          className="w-full"
        >
          Send magic link
        </Button>
      </form>
      {status && <div className="text-sm text-green-600 font-medium">{status}</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}
      {loginUrl && (
        <div className="rounded-lg border border-dashed border-border bg-card/60 p-4 text-sm backdrop-blur-sm">
          <div className="font-semibold text-foreground mb-1">Login URL (dev only)</div>
          <a className="text-primary hover:underline break-all" href={loginUrl}>
            {loginUrl}
          </a>
        </div>
      )}
    </div>
  );
}

