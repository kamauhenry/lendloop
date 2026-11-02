"use client";

import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LoanStatusBadge } from "@/components/LoanStatusBadge";
import type { Id } from "@/convex/_generated/dataModel";

type UpdateStatus = "approved" | "declined" | "returned";

export default function IncomingPage() {
  const { results: loans, status, loadMore } = usePaginatedQuery(api.loans.listIncoming, {}, { initialNumItems: 20 });
  const updateStatus = useMutation(api.loans.updateStatus);

  async function handle(loanId: Id<"loans">, status: UpdateStatus) {
    await updateStatus({ loanId, status });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Incoming Requests</h1>

      {status === "LoadingFirstPage" && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {status !== "LoadingFirstPage" && loans.length === 0 && (
        <p className="text-gray-400 text-sm">No incoming requests.</p>
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
                <p className="text-sm text-gray-500">
                  {loan.borrowerName}{" "}
                  <span className="text-gray-400">·</span>{" "}
                  {loan.startDate} → {loan.endDate}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <LoanStatusBadge status={loan.status} />

                {loan.status === "pending" && (
                  <>
                    <button
                      onClick={() => handle(loan._id, "approved")}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handle(loan._id, "declined")}
                      className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Decline
                    </button>
                  </>
                )}

                {(loan.status === "approved" || loan.status === "overdue") && (
                  <button
                    onClick={() => handle(loan._id, "returned")}
                    className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Mark returned
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
