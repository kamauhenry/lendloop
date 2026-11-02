"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RequestModal } from "@/components/RequestModal";
import type { Id } from "@/convex/_generated/dataModel";

const CATEGORY_COLOURS: Record<string, string> = {
  "power tools": "bg-orange-100 text-orange-700",
  garden: "bg-green-100 text-green-700",
  kitchen: "bg-yellow-100 text-yellow-700",
  camping: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-600",
};

export default function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);

  const tool = useQuery(api.tools.getById, { toolId: id as Id<"tools"> });
  const activeRequest = useQuery(api.loans.myActiveRequest, { toolId: id as Id<"tools"> });

  if (tool === undefined) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-64 bg-gray-100 rounded-xl" />
        <div className="h-8 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
      </div>
    );
  }

  if (tool === null) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-500">Tool not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-gray-400 underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← Back
      </button>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {tool.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tool.imageUrl}
            alt={tool.name}
            className="w-full h-64 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='sans-serif'%3EInvalid image URL%3C/text%3E%3C/svg%3E"; }}
          />
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{tool.name}</h1>
            <span
              className={`shrink-0 text-sm px-3 py-1 rounded-full font-medium ${
                tool.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {tool.available ? "Available" : "On loan"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm px-3 py-1 rounded-full font-medium ${CATEGORY_COLOURS[tool.category] ?? "bg-gray-100 text-gray-600"}`}
            >
              {tool.category}
            </span>
            <span className="text-sm text-gray-400 capitalize">Condition: {tool.condition}</span>
            {tool.trustedLender && (
              <span className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                Trusted Lender
              </span>
            )}
          </div>

          {tool.description && (
            <p className="text-gray-600 leading-relaxed">{tool.description}</p>
          )}

          {tool.available && !activeRequest && (
            <button
              onClick={() => setRequesting(true)}
              className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Request to borrow
            </button>
          )}
          {activeRequest && (
            <p className="text-center text-sm text-gray-500 py-3 border border-gray-200 rounded-lg">
              {activeRequest.status === "pending" ? "Request sent — awaiting approval" : "Currently approved"}
            </p>
          )}
        </div>
      </div>

      {requesting && (
        <RequestModal
          toolId={tool._id}
          toolName={tool.name}
          onClose={() => setRequesting(false)}
        />
      )}
    </div>
  );
}
