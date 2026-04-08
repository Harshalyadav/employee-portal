"use client";

import { getCurrentUser, restoreSession } from "@/stores/actions/auth.action";
import { useAppStore } from "@/stores";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { canAccessPathByRole, getDefaultDashboardPathForUser } from "@/lib/admin-head-access";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, isLoading, isAuthenticated } = useAppStore();

  useEffect(() => {
    const initAuth = async () => {
      // Skip auth initialization on public routes
      const publicRoutes = ["/home", "/login", "/auth/login", "/health"];
      const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route),
      );

      try {
        // First, try to restore session from cookies
        restoreSession();

        if (isPublicRoute) {
          setIsInitialized(true);
          return;
        }

        let resolvedUser = user;

        // Fetch current user if not already loaded
        if (!user) {
          const userData = await getCurrentUser();
          // If no user data, authentication failed - redirect to home
          if (!userData) {
            console.log("No user data returned, redirecting to home");
            router.replace("/home");
            setIsInitialized(true);
            return;
          }

          resolvedUser = userData;
        }

        if (!canAccessPathByRole(resolvedUser, pathname)) {
          router.replace(getDefaultDashboardPathForUser(resolvedUser));
          return;
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        // On error, redirect to home if not on public route
        if (!isPublicRoute) {
          console.log("Auth error on protected route, redirecting to home");
          router.replace("/home");
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [pathname, user, router]);

  // Show loading state while initializing auth
  if (!isInitialized || (isLoading && !user)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
