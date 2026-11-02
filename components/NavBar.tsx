"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const NAV_LINKS = [
  { href: "/dashboard", label: "All Tools" },
  { href: "/my-listings", label: "My Listings" },
  { href: "/my-requests", label: "My Requests" },
  { href: "/incoming", label: "Incoming" },
];

export function NavBar() {
  const pathname = usePathname();
  const me = useQuery(api.users.getMe);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-6">
        <Link href="/" className="font-bold text-gray-900 text-lg mr-4">
          LendLoop
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          ))}
          {me?.role === "admin" && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
              Admin
            </span>
          )}
        </nav>

        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
