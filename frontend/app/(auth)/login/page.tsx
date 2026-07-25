"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import { useLogin } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api-client";

interface LoginForm {
  email: string;
  password: string;
}

function LoginFormCard() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();
  const login = useLogin();
  const router = useRouter();
  const searchParams = useSearchParams();

  async function onSubmit(values: LoginForm) {
    try {
      await login.mutateAsync(values);
      const redirect = searchParams.get("redirect");
      if (redirect) router.push(redirect);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      setError("password", { message });
    }
  }

  return (
    <div className="rounded-lg border bg-white p-8 shadow-sm">
      <h1 className="mb-1 font-semibold text-lg">Truzon CMS</h1>
      <p className="mb-6 text-sm text-neutral-500">Sign in to manage the site.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email", { required: "Email is required." })}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password", { required: "Password is required." })}
        />
        <Button type="submit" disabled={isSubmitting || login.isPending} className="mt-2">
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <Link href="/forgot-password" className="mt-4 block text-center text-sm text-neutral-500 hover:text-neutral-900">
        Forgot password?
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginFormCard />
    </Suspense>
  );
}
