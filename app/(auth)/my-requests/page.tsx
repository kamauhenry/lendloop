"use client";

import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LoanStatusBadge } from "@/components/LoanStatusBadge";
import type { Id } from "@/convex/_generated/dataModel";

export default function MyRequestsPage() {
  const { results: loans, status, loadMore } = usePaginatedQuery(api.loans.listMine, {}, { initialNumItems: 20 });
  const updateStatus = useMutation(api.loans.updateStatus);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Requests</h1>

      {status === "LoadingFirstPage" && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {status !== "LoadingFirstPage" && loans.length === 0 && (
        <p className="text-gray-400 text-sm">
          You haven&apos;t requested any tools yet. Browse all tools to make a request.
        </p>
      )}

      {loans.length > 0 && (
        <div className="space-y-3">
          {loans.map((loan) => (
            <div
              key={loan._id}
              className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{loan.toolName}</p>
                <p className="text-sm text-gray-400">
                  {loan.startDate} → {loan.endDate}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <LoanStatusBadge status={loan.status} />
                {(loan.status === "approved" || loan.status === "overdue") && (
                  <button
                    onClick={() => updateStatus({ loanId: loan._id as Id<"loans">, status: "returned" })}
                    className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    I&apos;ve returned it
                  </button>
                )}
              </div>
            </div>
          ))}
          {status === "CanLoadMore" && (
            <div className="pt-2 text-center">
              <button
                onClick={() => loadMore(20)}
                className="px-4 py-2 bg-white border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
