type Status = "pending" | "confirmed" | "ready" | "shipped" | "completed";

const map: Record<Status, string> = {
  pending: "bg-[hsl(var(--status-pending)/0.15)] text-[hsl(var(--status-pending))] border-[hsl(var(--status-pending)/0.3)]",
  confirmed: "bg-[hsl(var(--status-confirmed)/0.15)] text-[hsl(var(--status-confirmed))] border-[hsl(var(--status-confirmed)/0.3)]",
  ready: "bg-[hsl(var(--status-ready)/0.15)] text-[hsl(var(--status-ready))] border-[hsl(var(--status-ready)/0.3)]",
  shipped: "bg-[hsl(var(--status-shipped)/0.15)] text-[hsl(var(--status-shipped))] border-[hsl(var(--status-shipped)/0.3)]",
  completed: "bg-[hsl(var(--status-completed)/0.15)] text-[hsl(var(--status-completed))] border-[hsl(var(--status-completed)/0.3)]",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${map[status]}`}>
      {status}
    </span>
  );
}
