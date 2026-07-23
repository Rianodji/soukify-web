"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth";
import { authService } from "@/infrastructure/auth/AuthApiAdapter";
import { HttpError } from "@/infrastructure/http/ApiClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) {
      setInvalidToken(true);
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword: data.newPassword });
      toast.success("Mot de passe mis à jour. Vous pouvez vous connecter.");
      router.push("/login");
    } catch (err) {
      if (err instanceof HttpError && err.statusCode === 400) {
        setInvalidToken(true);
      } else {
        toast.error("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token || invalidToken) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-error/10 mb-2">
          <ShieldCheck className="w-6 h-6 text-error" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Lien invalide ou expiré</h1>
        <p className="text-text-secondary text-sm">
          Ce lien de réinitialisation n&apos;est plus valable. Demandez-en un nouveau.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-2">
          <ShieldCheck className="w-6 h-6 text-brand" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Nouveau mot de passe</h1>
        <p className="text-text-secondary text-sm">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          type={showPassword ? "text" : "password"}
          label="Nouveau mot de passe"
          placeholder="8 caractères minimum"
          error={errors.newPassword?.message}
          autoComplete="new-password"
          autoFocus
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
          {...register("newPassword")}
        />

        <Input
          type={showPassword ? "text" : "password"}
          label="Confirmer le mot de passe"
          placeholder="8 caractères minimum"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register("confirmPassword")}
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Mettre à jour le mot de passe
        </Button>
      </form>
    </div>
  );
}
