import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

type PaymentStatus = "pending" | "awaiting_verification" | "paid" | "rejected";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const statusConfig: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: {
      label: "Pending",
      color: "bg-slate-100 text-slate-800 border border-slate-300",
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    awaiting_verification: {
      label: "Awaiting Verification",
      color: "bg-amber-100 text-amber-800 border border-amber-300",
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
    },
    paid: {
      label: "Paid",
      color: "bg-green-100 text-green-800 border border-green-300",
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
    },
    rejected: {
      label: "Rejected",
      color: "bg-red-100 text-red-800 border border-red-300",
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={`${config.color} gap-1 flex items-center w-fit`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
