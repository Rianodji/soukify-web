"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { authService } from "@/infrastructure/auth/AuthApiAdapter";
import { HttpError } from "@/infrastructure/http/ApiClient";
import { maskPhone } from "@/lib/utils";

const OTP_LENGTH = 6;
const RESEND_DELAY = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_DELAY);
  const [resending, setResending] = useState(false);
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("sk_otp_userId");
    const storedPhone = sessionStorage.getItem("sk_otp_phone");
    if (!storedUserId || !storedPhone) {
      router.replace("/login");
      return;
    }
    setUserId(storedUserId);
    setPhone(storedPhone);
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const submitOtp = useCallback(
    async (code: string) => {
      if (!userId) return;
      setLoading(true);
      setHasError(false);
      try {
        const result = await authService.verifyOtp({ userId, otpCode: code });

        /* Store tokens in httpOnly cookies via API route */
        await fetch("/api/auth/set-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          }),
        });

        sessionStorage.removeItem("sk_otp_userId");
        sessionStorage.removeItem("sk_otp_phone");

        toast.success("Connexion réussie ! Bienvenue sur Soukify 🎉");
        router.push("/dashboard");
      } catch (err) {
        if (err instanceof HttpError && err.statusCode === 401) {
          setHasError(true);
          setOtp("");
          toast.error("Code incorrect ou expiré");
        } else {
          toast.error("Une erreur est survenue. Réessayez.");
        }
      } finally {
        setLoading(false);
      }
    },
    [userId, router],
  );

  /* Auto-submit when all digits are filled */
  useEffect(() => {
    if (otp.length === OTP_LENGTH) {
      submitOtp(otp);
    }
  }, [otp, submitOtp]);

  async function handleResend() {
    if (countdown > 0 || !phone) return;
    setResending(true);
    try {
      const { userId: newUserId } = await authService.sendOtp(phone);
      sessionStorage.setItem("sk_otp_userId", newUserId);
      setUserId(newUserId);
      setCountdown(RESEND_DELAY);
      setOtp("");
      setHasError(false);
      toast.success("Nouveau code envoyé par SMS !");
    } catch {
      toast.error("Impossible d'envoyer le code. Réessayez.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-100 mb-2">
          <MessageSquare className="w-6 h-6 text-gold" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          Vérification par SMS
        </h1>
        <p className="text-text-secondary text-sm">
          Un code à 6 chiffres a été envoyé au{" "}
          <span className="font-semibold text-text-primary">
            {phone ? maskPhone(phone) : "…"}
          </span>
        </p>
      </div>

      {/* OTP input */}
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <OtpInput
            value={otp}
            onChange={setOtp}
            error={hasError}
            maxLength={OTP_LENGTH}
            disabled={loading}
          />

          {loading && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="h-4 w-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              Vérification en cours…
            </div>
          )}
        </div>

        {/* Manual submit (fallback) */}
        <Button
          size="lg"
          className="w-full"
          onClick={() => submitOtp(otp)}
          disabled={otp.length !== OTP_LENGTH || loading}
          loading={loading}
        >
          Valider le code
        </Button>
      </div>

      {/* Resend */}
      <div className="text-center space-y-2">
        <p className="text-sm text-text-secondary">Vous n&apos;avez pas reçu le code ?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || resending}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover transition-colors disabled:text-text-disabled disabled:cursor-not-allowed"
        >
          {resending ? (
            <>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Envoi en cours…
            </>
          ) : countdown > 0 ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Renvoyer dans {countdown}s
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Renvoyer le code
            </>
          )}
        </button>
      </div>

      {/* Back */}
      <div className="text-center border-t border-border pt-5">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Modifier le numéro de téléphone
        </Link>
      </div>

      {/* Security note */}
      <div className="rounded-xl bg-warning-light border border-accent-200 p-3">
        <p className="text-xs text-amber-800">
          🔒 <strong>Ne partagez jamais ce code.</strong> Soukify ne vous demandera jamais votre code par téléphone ou SMS.
        </p>
      </div>
    </div>
  );
}
