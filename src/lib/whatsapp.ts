export type WhatsAppMessageType =
  | 'payment_approved'
  | 'payment_rejected'
  | 'order_confirmed'
  | 'ready_for_pickup'
  | 'shipped'
  | 'completed'
  | 'custom';

export interface WhatsAppOrderData {
  order_number: string;
  business_name?: string;
  payment_status?: string;
  delivery_type?: string;
}

export const formatWhatsAppNumber = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  } else if (cleaned.startsWith('234')) {
    // Already in correct format
  } else if (cleaned.length === 10) { // e.g. 8012345678 missing 0 or 234
    cleaned = '234' + cleaned;
  }
  
  return cleaned;
};

export const generateWhatsAppMessage = (
  type: WhatsAppMessageType,
  data: WhatsAppOrderData
): string => {
  const businessNameStr = data.business_name ? ` ${data.business_name}` : '';
  const orderNumStr = data.order_number;
  
  switch (type) {
    case 'payment_approved':
      return `Hello${businessNameStr},\n\nYour payment for Order ${orderNumStr} has been approved.\n\nLeo Cosmetics is now processing your order.\n\nThank you.`;
    case 'payment_rejected':
      return `Hello${businessNameStr},\n\nUnfortunately, we could not verify your payment for Order ${orderNumStr}.\n\nPlease contact us for assistance or try making the payment again.\n\nThank you.`;
    case 'order_confirmed':
      return `Hello${businessNameStr},\n\nYour Order ${orderNumStr} has been confirmed.\n\nWe will notify you once there is an update.\n\nThank you for choosing Leo Cosmetics.`;
    case 'ready_for_pickup':
      return `Hello${businessNameStr},\n\nGreat news! Your Order ${orderNumStr} is now ready for pickup.\n\nPlease visit our store to collect your items.\n\nThank you.`;
    case 'shipped':
      return `Hello${businessNameStr},\n\nYour Order ${orderNumStr} has been shipped!\n\nIt is on its way to you via ${data.delivery_type || 'our delivery partners'}.\n\nThank you.`;
    case 'completed':
      return `Hello${businessNameStr},\n\nYour Order ${orderNumStr} has been marked as completed.\n\nThank you for your business. We hope to serve you again soon!`;
    default:
      return `Hello${businessNameStr},\n\nThere is an update regarding your Order ${orderNumStr}.\n\nPlease check your dashboard for details.\n\nThank you.`;
  }
};

export const getWhatsAppUrl = (phone: string, message: string): string | null => {
  const formattedPhone = formatWhatsAppNumber(phone);
  if (!formattedPhone) return null;
  
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};
