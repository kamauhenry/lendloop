"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface RequestModalProps {
  toolId: Id<"tools">;
  toolName: string;
  onClose: () => void;
}

export function RequestModal({ toolId, toolName, onClose }: RequestModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createLoan = useMutation(api.loans.create);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (endDate < startDate) {
      setError("End date must be on or after start date");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createLoan({ toolId, startDate, endDate });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="font-semibold text-lg text-gray-900 mb-1">Request to borrow</h2>
        <p className="text-sm text-gray-500 mb-4">{toolName}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending…" : "Send request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
