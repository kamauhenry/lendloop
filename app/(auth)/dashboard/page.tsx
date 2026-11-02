"use client";

import { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ToolCard } from "@/components/ToolCard";
import { RequestModal } from "@/components/RequestModal";
import type { Id } from "@/convex/_generated/dataModel";

type Category = "power tools" | "garden" | "kitchen" | "camping" | "other";

const CATEGORIES: Category[] = ["power tools", "garden", "kitchen", "camping", "other"];

export default function DashboardPage() {
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [requesting, setRequesting] = useState<{ id: Id<"tools">; name: string } | null>(null);

  const { results: tools, status, loadMore } = usePaginatedQuery(
    api.tools.listAll,
    { category, availableOnly },
    { initialNumItems: 12 },
  );
  const activeToolIds = useQuery(api.loans.myActiveToolIds) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Tools</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setCategory(undefined)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            category === undefined ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All categories
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c === category ? undefined : c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              category === c ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {c}
          </button>
        ))}

        <label className="ml-2 flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="rounded"
          />
          Available only
        </label>
      </div>

      {status === "LoadingFirstPage" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {status !== "LoadingFirstPage" && tools.length === 0 && (
        <p className="text-gray-400 text-sm">No tools match your filters.</p>
      )}

      {tools.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <ToolCard
                key={tool._id}
                tool={tool}
                alreadyRequested={activeToolIds.includes(tool._id)}
                onRequest={() => setRequesting({ id: tool._id, name: tool.name })}
              />
            ))}
          </div>

          {status === "CanLoadMore" && (
            <div className="mt-6 text-center">
              <button
                onClick={() => loadMore(12)}
                className="px-4 py-2 bg-white border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {requesting && (
        <RequestModal
          toolId={requesting.id}
          toolName={requesting.name}
          onClose={() => setRequesting(null)}
        />
      )}
    </div>
  );
}
