import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { UserSyncer } from "@/components/UserSyncer";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <>
      <NavBar />
      <UserSyncer>
        <ErrorBoundary>
          <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
        </ErrorBoundary>
      </UserSyncer>
    </>
  );
}
