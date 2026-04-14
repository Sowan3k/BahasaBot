"use client";

/**
 * /reset-password — legacy email-link page
 *
 * The password-reset flow now uses a 6-digit verification code sent to the
 * user's inbox instead of a clickable link. This page exists only to handle
 * any old-format links that may have been bookmarked or cached.
 *
 * It immediately redirects to /forgot-password so the user can start the
 * new code-based flow.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";

export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/forgot-password"), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center space-y-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          <Image
            src="/Logo new only box (1).svg"
            alt="BahasaBot"
            width={52}
            height={52}
            priority
            className="object-contain"
          />
        </motion.div>

        <div>
          <h1 className="text-xl font-bold text-white">Link Expired</h1>
          <p className="text-white/55 text-sm mt-2 leading-relaxed">
            Password reset links are no longer supported.
            We now use a 6-digit verification code instead.
          </p>
          <p className="text-white/40 text-xs mt-3">
            Redirecting you to reset your password…
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Reset password now →
        </Link>
      </div>
    </AuthCard>
  );
}
