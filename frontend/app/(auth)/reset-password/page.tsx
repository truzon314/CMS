"use client";

import { useForm } from "react-hook-form";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import { useResetPassword } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api-client";

interface ResetForm {
  newPassword: string;
  confirmPassword: string;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>();

  async function onSubmit(values: ResetForm) {
    if (values.newPassword !== values.confirmPassword) {
      setError("confirmPassword", { message: "Passwords don't match." });
      return;
    }
    try {
      await resetPassword.mutateAsync({ token, newPassword: values.newPassword });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      setError("newPassword", { message });
    }
  }

  if (!token) {
    return (
      <div className="rounded-lg border bg-white p-8 shadow-sm">
        <p className="text-sm text-neutral-500">
          This reset link is missing its token. Request a new one from the forgot-password page.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-8 shadow-sm">
      <h1 className="mb-1 font-semibold text-lg">Set a new password</h1>
      <p className="mb-6 text-sm text-neutral-500">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField
          label="New password"
          type="password"
          error={errors.newPassword?.message}
          {...register("newPassword", { required: "A new password is required.", minLength: { value: 8, message: "At least 8 characters." } })}
        />
        <TextField
          label="Confirm password"
          type="password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", { required: "Please confirm your password." })}
        />
        <Button type="submit" disabled={isSubmitting || resetPassword.isPending}>
          {resetPassword.isPending ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
