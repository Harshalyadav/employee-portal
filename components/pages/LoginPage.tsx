"use client";

import { LoginForm } from "@/components/form";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/stores";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getDefaultDashboardPathForUser } from "@/lib/admin-head-access";

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, error } = useAppStore();

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,#dff2ff,transparent_28%),radial-gradient(circle_at_bottom_right,#fde9d8,transparent_22%),linear-gradient(135deg,#f7fbff_0%,#fffdf8_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl grid gap-6 lg:gap-8 lg:grid-cols-2 lg:items-stretch">
        <div className="relative flex flex-col justify-center rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_-40px_rgba(31,143,213,0.55)] backdrop-blur-md sm:p-8 lg:p-10">
          <div className="space-y-2 mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-6 flex items-center gap-2">
              <div className="w-32 sm:w-40 max-w-xs">
                <Image
                  src="/images/logo.svg"
                  alt="App preview"
                  width={600}
                  height={600}
                  priority
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Welcome Back!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Sign in with your work email to receive a secure one-time passcode.
            </p>
          </div>
          <Card className="border-none shadow-none bg-transparent p-0">
            <LoginForm
              isLoading={!!isLoading}
              error={typeof error === "string" ? error : null}
              onSuccess={() => {
                const landingPath = getDefaultDashboardPathForUser(useAppStore.getState().user) || "/";
                router.replace(landingPath);
                router.refresh();
              }}
            />
          </Card>
        </div>
        <div className="relative hidden overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[#10263b] p-8 text-white shadow-[0_30px_80px_-40px_rgba(16,38,59,0.75)] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_28%),radial-gradient(circle_at_70%_20%,rgba(96,165,250,0.24),transparent_24%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent_55%)]" />
          <div className="relative z-10 max-w-md space-y-5">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
              My HRMS Cloud
            </span>
            <h2 className="text-3xl font-semibold leading-tight text-white">
              Fast, passwordless access for your HRMS workspace.
            </h2>
            <p className="text-sm leading-6 text-slate-300">
              OTP login reduces credential friction while keeping employee access tied to a registered work email.
            </p>
          </div>
          <div className="relative z-10 grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Secure Sign-In Flow</p>
              <p className="mt-2 text-sm text-slate-300">
                1. Enter your registered email. 2. Receive a 6-digit code. 3. Verify and continue.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                <p className="text-2xl font-semibold text-white">6 Digit</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">OTP Code</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                <p className="text-2xl font-semibold text-white">5 Min</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300">Expiry Window</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
