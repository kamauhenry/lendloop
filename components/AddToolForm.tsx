"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type Category = "power tools" | "garden" | "kitchen" | "camping" | "other";
type Condition = "new" | "good" | "fair" | "worn";

const CATEGORIES: Category[] = ["power tools", "garden", "kitchen", "camping", "other"];
const CONDITIONS: Condition[] = ["new", "good", "fair", "worn"];

export function AddToolForm({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [condition, setCondition] = useState<Condition>("good");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createTool = useMutation(api.tools.create);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createTool({
        name: name.trim(),
        category,
        condition,
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });
      setName("");
      setDescription("");
      setImageUrl("");
      setOpen(false);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add tool");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
      >
        + Add a tool
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 max-w-lg"
    >
      <h3 className="font-semibold text-gray-900">New listing</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tool name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Circular saw"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as Condition)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Brief description (optional)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg  (must be a direct image link)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="text-xs text-gray-400 mt-1">Right-click any image online → &quot;Open image in new tab&quot; → copy that URL</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Adding…" : "Add tool"}
        </button>
      </div>
    </form>
  );
}
