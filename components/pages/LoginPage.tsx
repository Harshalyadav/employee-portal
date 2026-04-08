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
    <div className="min-h-screen w-full bg-linear-to-br from-background via-background to-muted/30 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl grid gap-6 lg:gap-8 lg:grid-cols-2 lg:items-stretch">
        {/* Left: Form Section */}
        <div className="relative flex flex-col justify-center rounded-2xl bg-card/60 backdrop-blur-md border shadow-sm p-6 sm:p-8 lg:p-10">
          <div className="space-y-2 mb-6 sm:mb-8">
            {/* Logo placeholder */}
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
              Please enter log in details below
            </p>
          </div>
          <Card className="border-none shadow-none bg-transparent p-0">
            <LoginForm
              isLoading={!!isLoading}
              error={typeof error === "string" ? error : null}
              onSuccess={() => {
                console.log('onSuccess called, redirecting to home');
                const landingPath = getDefaultDashboardPathForUser(useAppStore.getState().user);
                router.push(landingPath);
                router.refresh();
              }}
            />
          </Card>
        </div>
        {/* Right: Illustration / Promo Section */}
        <div className="hidden lg:flex relative rounded-2xl overflow-hidden bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,255,210,0.15),transparent_60%)]" />
          <div className="relative z-10 flex flex-col justify-center items-center text-center p-8 lg:p-10 gap-4 lg:gap-6">
            <div className="w-full max-w-xs mx-auto">
              <Image
                src="/images/logo.svg"
                alt="App preview"
                width={600}
                height={600}
                priority
                className="w-full h-auto object-contain"
              />
            </div>
            <h2 className="text-xl lg:text-2xl font-semibold tracking-tight text-white">
              Manage your HRMS Anywhere
            </h2>
            <p className="text-sm lg:text-base text-white/70 max-w-sm">
              You can manage your HRMS on the go with HRMS on the web.
            </p>
            <div className="flex gap-2 mt-4">
              <span className="h-2 w-2 rounded-full bg-white/60" />
              <span className="h-2 w-2 rounded-full bg-white/30" />
              <span className="h-2 w-2 rounded-full bg-white/30" />
            </div>
          </div>
          <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
