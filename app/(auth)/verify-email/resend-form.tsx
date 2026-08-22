"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resendVerificationAction } from "./actions";

export function ResendForm() {
  const [email, setEmail] = useState("");
  const [devPath, setDevPath] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await resendVerificationAction(email);
    setLoading(false);
    setSent(true);
    if (result.devPath) setDevPath(result.devPath);
  };

  if (sent) {
    return (
      <div className="mt-4 space-y-3 text-sm">
        <p className="text-slate-600">
          If an unverified account exists for that email, a new verification link has been generated.
        </p>
        {devPath && (
          <Link href={devPath} className="block rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 font-medium text-slate-700 underline-offset-2 hover:underline">
            {devPath}
          </Link>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        required
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" disabled={loading} className="shrink-0">
        Resend link
      </Button>
    </form>
  );
}
