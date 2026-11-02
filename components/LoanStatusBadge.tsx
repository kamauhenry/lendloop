const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  returned: "bg-gray-100 text-gray-600",
  overdue: "bg-red-200 text-red-800",
};

export function LoanStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}
