import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronDown } from "lucide-react";
import { 
  WhatsAppMessageType, 
  WhatsAppOrderData, 
  generateWhatsAppMessage, 
  getWhatsAppUrl 
} from "@/lib/whatsapp";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WhatsAppButtonProps {
  phone?: string | null;
  orderData: WhatsAppOrderData;
  template?: WhatsAppMessageType; // If provided, button sends this directly. If not, shows a dropdown.
  variant?: "default" | "outline" | "ghost" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

const TEMPLATES: { type: WhatsAppMessageType; label: string }[] = [
  { type: "payment_approved", label: "Payment Approved" },
  { type: "payment_rejected", label: "Payment Rejected" },
  { type: "order_confirmed", label: "Order Confirmed" },
  { type: "ready_for_pickup", label: "Ready for Pickup" },
  { type: "shipped", label: "Order Shipped" },
  { type: "completed", label: "Order Completed" },
];

export default function WhatsAppButton({
  phone,
  orderData,
  template,
  variant = "outline",
  size = "sm",
  className = "",
  showLabel = true,
}: WhatsAppButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = (selectedTemplate: WhatsAppMessageType) => {
    if (!phone) return;
    
    setIsLoading(true);
    try {
      const message = generateWhatsAppMessage(selectedTemplate, orderData);
      const url = getWhatsAppUrl(phone, message);
      
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !phone || isLoading;

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${className} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
      disabled={isDisabled}
      onClick={template ? () => handleSend(template) : undefined}
      type="button"
    >
      <MessageCircle className="h-4 w-4 text-green-500" />
      {showLabel && <span>WhatsApp Update</span>}
      {!template && <ChevronDown className="h-3 w-3 ml-1 opacity-50" />}
    </Button>
  );

  const wrapperContent = template ? (
    buttonContent
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isDisabled}>
        {buttonContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {TEMPLATES.map((t) => (
          <DropdownMenuItem key={t.type} onClick={() => handleSend(t.type)}>
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!phone) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block cursor-not-allowed">
              <Button
                variant={variant}
                size={size}
                className={`gap-2 ${className} cursor-not-allowed opacity-50`}
                disabled={true}
                type="button"
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                {showLabel && <span>WhatsApp Update</span>}
                {!template && <ChevronDown className="h-3 w-3 ml-1 opacity-50" />}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>No phone number available for this customer.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return wrapperContent;
}
