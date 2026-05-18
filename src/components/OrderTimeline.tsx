import { Check, Clock } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "ready" | "shipped" | "completed";

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  createdAt: string;
  deliveryType?: "pickup" | "delivery";
}

export default function OrderTimeline({ currentStatus, createdAt, deliveryType }: OrderTimelineProps) {
  const allSteps: { id: OrderStatus; label: string; description: string }[] = [
    { id: "pending", label: "Order Placed", description: "Your order has been received" },
    { id: "confirmed", label: "Confirmed", description: "Order confirmed and processing" },
    { id: "ready", label: "Ready", description: "Order is ready for pickup/shipment" },
    { id: "shipped", label: "Shipped", description: "Order is on its way" },
    {
      id: "completed",
      label: deliveryType === "pickup" ? "Picked Up" : "Delivered",
      description: deliveryType === "pickup" ? "Order picked up from location" : "Order completed",
    },
  ];

  const steps = deliveryType === "pickup"
    ? allSteps.filter((step) => step.id !== "shipped")
    : allSteps;

  const stepIndex = steps.findIndex((s) => s.id === currentStatus);
  const isCompleted = (step: OrderStatus) => steps.findIndex((s) => s.id === step) <= stepIndex;

  return (
    <div className="py-2">
      <div className="flex items-start gap-4">
        {steps.map((step, idx) => {
          const completed = isCompleted(step.id);
          const isCurrent = step.id === currentStatus;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mb-2 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground border-primary shadow-lg"
                    : completed
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "bg-muted text-muted-foreground border-muted-foreground/30"
                }`}
              >
                {completed && !isCurrent ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <div className="text-xs font-bold">{idx + 1}</div>
                )}
              </div>

              {/* Step Label */}
              <div className="text-center">
                <div className={`text-xs font-semibold ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                  {step.label}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                  {step.description}
                </div>
              </div>

              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div
                  className={`w-0.5 h-6 mt-2 ${
                    completed && idx < stepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
