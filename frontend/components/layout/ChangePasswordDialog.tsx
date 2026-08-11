"use client";

import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import { useChangePassword } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api-client";

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>();

  async function onSubmit(values: ChangePasswordForm) {
    if (values.newPassword !== values.confirmPassword) {
      setError("confirmPassword", { message: "Passwords don't match." });
      return;
    }
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      // No need to reset()/close manually — a successful change redirects to
      // /login (useChangePassword's onSuccess), unmounting this dialog.
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      setError("currentPassword", { message });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            You&apos;ll be signed out everywhere else once this is saved — log back in here with the new password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextField
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register("currentPassword", { required: "Your current password is required." })}
          />
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword", {
              required: "A new password is required.",
              minLength: { value: 8, message: "At least 8 characters." },
            })}
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", { required: "Please confirm your new password." })}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || changePassword.isPending}>
              {changePassword.isPending ? "Saving…" : "Change password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
