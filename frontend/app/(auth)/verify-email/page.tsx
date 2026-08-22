import Link from "next/link";
import { CheckCircle2, XCircle, MailQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "./actions";
import { ResendForm } from "./resend-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MailQuestion className="h-12 w-12 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-900">Verify your email</h2>
        <p className="text-sm text-slate-500">
          Enter the email you registered with and we&apos;ll generate a fresh verification link.
        </p>
        <ResendForm />
        <Link href="/login" className="mt-2 text-sm font-medium text-slate-900 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  const result = await verifyEmailAction(token);

  if (!result.success) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <XCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-semibold text-slate-900">Verification failed</h2>
        <p className="text-sm text-slate-500">{result.error}</p>
        <ResendForm />
        <Link href="/login" className="mt-2 text-sm font-medium text-slate-900 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      <h2 className="text-lg font-semibold text-slate-900">Email verified</h2>
      <p className="text-sm text-slate-500">Your account is ready. You can now sign in to Dayflow.</p>
      <Button asChild className="w-full">
        <Link href="/login">Continue to sign in</Link>
      </Button>
    </div>
  );
}
