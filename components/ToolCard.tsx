import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

interface Tool {
  _id: Id<"tools">;
  name: string;
  category: string;
  condition: string;
  description: string;
  imageUrl?: string;
  available: boolean;
  trustedLender: boolean;
}

interface ToolCardProps {
  tool: Tool;
  onRequest?: () => void;
  alreadyRequested?: boolean;
}

const CATEGORY_COLOURS: Record<string, string> = {
  "power tools": "bg-orange-100 text-orange-700",
  garden: "bg-green-100 text-green-700",
  kitchen: "bg-yellow-100 text-yellow-700",
  camping: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-600",
};

export function ToolCard({ tool, onRequest, alreadyRequested }: ToolCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col">
      {tool.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tool.imageUrl}
          alt={tool.name}
          className="w-full h-40 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='12' font-family='sans-serif'%3EInvalid image URL%3C/text%3E%3C/svg%3E"; }}
        />
      )}
      <div className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900">{tool.name}</h3>
          {tool.trustedLender && (
            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
              Trusted Lender
            </span>
          )}
        </div>
        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
            tool.available
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {tool.available ? "Available" : "On loan"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOURS[tool.category] ?? "bg-gray-100 text-gray-600"}`}
        >
          {tool.category}
        </span>
        <span className="text-xs text-gray-400 capitalize">{tool.condition}</span>
      </div>

      {tool.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{tool.description}</p>
      )}

      <div className="mt-auto flex gap-2">
        <Link
          href={`/tools/${tool._id}`}
          className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          View details
        </Link>
        {onRequest && tool.available && !alreadyRequested && (
          <button
            onClick={onRequest}
            className="flex-1 py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Request
          </button>
        )}
        {alreadyRequested && (
          <span className="flex-1 py-2 px-4 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg text-center">
            Requested
          </span>
        )}
      </div>
      </div>
    </div>
  );
}
