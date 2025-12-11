"use client";

import { FormEvent, useState } from "react";

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
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-sm text-zinc-600">
        Enter your email to request a magic link. In development, the login URL
        will be shown below for copy/paste.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Email</span>
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Send magic link
        </button>
      </form>
      {status && <div className="text-sm text-green-700">{status}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loginUrl && (
        <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm">
          <div className="font-semibold">Login URL (dev only)</div>
          <a className="text-blue-700 underline" href={loginUrl}>
            {loginUrl}
          </a>
        </div>
      )}
    </div>
  );
}

