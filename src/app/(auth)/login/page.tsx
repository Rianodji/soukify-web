"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Mail, AlertCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { authService } from "@/infrastructure/auth/AuthApiAdapter";
import { HttpError } from "@/infrastructure/http/ApiClient";
import { isSafeInternalPath } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  const sessionExpired = searchParams.get("reason") === "session_expired";

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await authService.login(data);

      /* Store tokens in httpOnly cookies via API route */
      await fetch("/api/auth/set-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, refreshToken }),
      });

      toast.success("Connexion réussie ! Bienvenue sur Soukify 🎉");
      const from = searchParams.get("from");
      router.push(from && isSafeInternalPath(from) ? from : "/dashboard");
    } catch (err) {
      if (err instanceof HttpError && err.statusCode === 401) {
        toast.error("Email ou mot de passe incorrect");
      } else if (err instanceof HttpError) {
        toast.error(err.message);
      } else {
        toast.error("Impossible de se connecter. Vérifiez votre connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-2">
          <Mail className="w-6 h-6 text-brand" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          Connexion à Soukify
        </h1>
        <p className="text-text-secondary text-sm">
          Entrez votre email et votre mot de passe pour accéder à votre compte.
        </p>
      </div>

      {sessionExpired && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-warning-light border border-warning">
          <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">Votre session a expiré ou votre compte n&apos;a plus accès. Reconnectez-vous.</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          type="email"
          label="Email"
          placeholder="vous@exemple.com"
          error={errors.email?.message}
          autoComplete="email"
          autoFocus
          {...register("email")}
        />

        <Input
          type={showPassword ? "text" : "password"}
          label="Mot de passe"
          placeholder="••••••••"
          error={errors.password?.message}
          autoComplete="current-password"
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-text-secondary hover:text-text-primary transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register("password")}
        />

        <div className="flex justify-end -mt-2">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-brand hover:text-brand-hover transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
        >
          Se connecter
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-text-disabled bg-background px-3">
          Première fois sur Soukify ?
        </div>
      </div>

      {/* Register link */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
        >
          Créer un compte gratuitement
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
