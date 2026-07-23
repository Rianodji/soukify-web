"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { authService } from "@/infrastructure/auth/AuthApiAdapter";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setLoading(true);
    try {
      await authService.forgotPassword(data);
    } catch {
      /* Réponse toujours générique côté API — pas d'énumération de compte */
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-2">
          <MailCheck className="w-6 h-6 text-brand" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Vérifiez votre email</h1>
        <p className="text-text-secondary text-sm">
          Si un compte existe avec cette adresse, un lien de réinitialisation vient de vous être envoyé.
          Le lien est valable environ 30 minutes.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-2">
          <KeyRound className="w-6 h-6 text-brand" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Mot de passe oublié</h1>
        <p className="text-text-secondary text-sm">
          Entrez votre email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

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

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Envoyer le lien de réinitialisation
        </Button>
      </form>

      <div className="text-center border-t border-border pt-5">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
