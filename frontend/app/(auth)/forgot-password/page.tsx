"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import { useForgotPassword } from "@/hooks/useAuth";

interface ForgotForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState } = useForm<ForgotForm>();
  const forgotPassword = useForgotPassword();
  const [sent, setSent] = useState(false);

  async function onSubmit(values: ForgotForm) {
    await forgotPassword.mutateAsync(values.email);
    setSent(true);
  }

  return (
    <div className="rounded-lg border bg-white p-8 shadow-sm">
      <h1 className="mb-1 font-semibold text-lg">Reset your password</h1>

      {sent ? (
        <p className="text-sm text-neutral-500">
          If that email exists, we&apos;ve sent a reset link. Check your inbox.
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm text-neutral-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              {...register("email", { required: "Email is required." })}
            />
            <Button type="submit" disabled={formState.isSubmitting || forgotPassword.isPending}>
              {forgotPassword.isPending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </>
      )}

      <Link href="/login" className="mt-4 block text-center text-sm text-neutral-500 hover:text-neutral-900">
        Back to login
      </Link>
    </div>
  );
}
