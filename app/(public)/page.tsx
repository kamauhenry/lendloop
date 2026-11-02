import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { PublicToolList } from "@/components/PublicToolList";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            LendLoop
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Borrow what you need. Lend what you don&apos;t.
          </p>
          <div className="mt-8">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">
                  Sign in to lend or borrow
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Go to Dashboard →
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Available tools — public read-only */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-lg font-semibold text-gray-700 mb-6">
          Available in your neighbourhood
        </h2>
        <PublicToolList />
      </section>
    </main>
  );
}
