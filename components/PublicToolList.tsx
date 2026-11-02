"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const CATEGORY_COLOURS: Record<string, string> = {
  "power tools": "bg-orange-100 text-orange-700",
  garden: "bg-green-100 text-green-700",
  kitchen: "bg-yellow-100 text-yellow-700",
  camping: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-600",
};

export function PublicToolList() {
  const tools = useQuery(api.tools.listAvailable);

  if (tools === undefined) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <p className="text-gray-400 text-sm">
        No tools listed yet — be the first to lend something.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {tools.map((tool) => (
        <Link
          key={tool._id}
          href={`/tools/${tool._id}`}
          className="bg-white border border-gray-100 rounded-lg px-4 py-3 flex flex-col gap-1 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <span className="font-medium text-sm text-gray-800 truncate">{tool.name}</span>
          <span
            className={`self-start text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOURS[tool.category] ?? "bg-gray-100 text-gray-600"}`}
          >
            {tool.category}
          </span>
        </Link>
      ))}
    </div>
  );
}
