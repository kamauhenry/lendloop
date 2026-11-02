"use client";

import { useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Waits for Convex to confirm the Clerk JWT is accepted before ensuring user exists.
export function UserSyncer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureUser = useMutation(api.users.ensureUser);

  useEffect(() => {
    if (isAuthenticated) {
      ensureUser().catch(console.error);
    }
  }, [isAuthenticated, ensureUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
