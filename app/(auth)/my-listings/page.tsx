"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AddToolForm } from "@/components/AddToolForm";
import type { Id } from "@/convex/_generated/dataModel";

export default function MyListingsPage() {
  const tools = useQuery(api.tools.listMine);
  const removeTool = useMutation(api.tools.remove);
  const setAvailable = useMutation(api.tools.setAvailable);

  async function handleRemove(toolId: Id<"tools">) {
    if (!confirm("Remove this listing?")) return;
    await removeTool({ toolId });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
      </div>

      <div className="mb-8">
        <AddToolForm />
      </div>

      {tools === undefined && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {tools?.length === 0 && (
        <p className="text-gray-400 text-sm">You haven&apos;t listed any tools yet.</p>
      )}

      {tools && tools.length > 0 && (
        <div className="space-y-3">
          {tools.map((tool) => (
            <div
              key={tool._id}
              className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{tool.name}</p>
                <p className="text-sm text-gray-400 capitalize">
                  {tool.category} · {tool.condition}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tool.available}
                    onChange={(e) => setAvailable({ toolId: tool._id, available: e.target.checked })}
                    className="rounded"
                  />
                  Available
                </label>

                <button
                  onClick={() => handleRemove(tool._id)}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
