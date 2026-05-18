import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.VITE_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.VITE_SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.VITE_SMTP_USER || '',
        pass: process.env.VITE_SMTP_PASS || '',
      },
    };

    this.transporter = nodemailer.createTransporter(config);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${process.env.VITE_FROM_NAME || 'Leo Cosmetics'}" <${process.env.VITE_FROM_EMAIL || 'noreply@leocosmetics.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendOrderConfirmation(orderData: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    items: Array<{
      name: string;
      variant?: string;
      size?: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    total: number;
    deliveryType: 'pickup' | 'delivery';
    deliveryAddress?: string;
    paymentMethod: 'pickup' | 'bank_transfer';
  }): Promise<boolean> {
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          <strong>${item.name}</strong><br>
          <small style="color: #666;">${[item.variant, item.size].filter(Boolean).join(' · ')}</small>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦${item.unitPrice.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₦${item.subtotal.toLocaleString()}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation - ${orderData.orderNumber}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your order</p>
          </div>

          <div style="background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px; padding: 30px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px 0; color: #333;">Order Details</h2>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #667eea;">Order #${orderData.orderNumber}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">Product</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: bold;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: bold;">Unit Price</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: bold;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #dee2e6;">Total:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea; border-top: 2px solid #dee2e6;">₦${orderData.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Fulfillment</h3>
                <p style="margin: 0; color: #666;">${orderData.deliveryType === 'pickup' ? 'Pickup from warehouse' : 'Delivery to address'}</p>
                ${orderData.deliveryAddress ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${orderData.deliveryAddress}</p>` : ''}
              </div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Payment</h3>
                <p style="margin: 0; color: #666;">${orderData.paymentMethod === 'pickup' ? 'Pay on pickup/delivery' : 'Bank transfer'}</p>
              </div>
            </div>

            <div style="background: #e8f5e8; border: 1px solid #c8e6c9; border-radius: 8px; padding: 20px; margin-top: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 16px;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>We'll process your order within 1-2 business days</li>
                <li>You'll receive updates on your order status</li>
                <li>${orderData.deliveryType === 'pickup' ? 'You can pick up your order once it\'s ready' : 'Your order will be delivered to the specified address'}</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                Questions? Contact us at <a href="mailto:support@leocosmetics.com" style="color: #667eea;">support@leocosmetics.com</a>
              </p>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                Leo Cosmetics Wholesale - Your trusted beauty products partner
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Order Confirmation - ${orderData.orderNumber}

Dear ${orderData.customerName},

Thank you for your order! Your order has been confirmed.

Order Details:
${orderData.items.map(item =>
  `- ${item.name} ${[item.variant, item.size].filter(Boolean).join(' · ')} x${item.quantity} = ₦${item.subtotal.toLocaleString()}`
).join('\n')}

Total: ₦${orderData.total.toLocaleString()}
Fulfillment: ${orderData.deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}
Payment: ${orderData.paymentMethod === 'pickup' ? 'Pay on pickup/delivery' : 'Bank transfer'}

We'll process your order within 1-2 business days and keep you updated on the status.

Questions? Contact us at support@leocosmetics.com

Leo Cosmetics Wholesale
    `;

    return this.sendEmail({
      to: orderData.customerEmail,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html,
      text,
    });
  }

  async sendOrderStatusUpdate(orderData: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    newStatus: string;
    deliveryType: 'pickup' | 'delivery';
  }): Promise<boolean> {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is now being processed.',
      ready: orderData.deliveryType === 'pickup'
        ? 'Your order is ready for pickup at our warehouse.'
        : 'Your order is ready and will be shipped soon.',
      shipped: 'Your order has been shipped and is on its way to you.',
      completed: 'Your order has been delivered successfully.',
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Update - ${orderData.orderNumber}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1 style="margin: 0; font-size: 24px;">Order Update</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${orderData.orderNumber}</p>
          </div>

          <div style="background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px; padding: 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">📦</div>
            <h2 style="margin: 0 0 20px 0; color: #333;">Status: ${orderData.newStatus.charAt(0).toUpperCase() + orderData.newStatus.slice(1)}</h2>
            <p style="margin: 0 0 30px 0; font-size: 16px; color: #666;">${statusMessages[orderData.newStatus as keyof typeof statusMessages] || 'Your order status has been updated.'}</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666;">
                You can track your order status anytime by logging into your account at <a href="${process.env.VITE_APP_URL || 'http://localhost:8080'}" style="color: #667eea;">our website</a>.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                Questions? Contact us at <a href="mailto:support@leocosmetics.com" style="color: #667eea;">support@leocosmetics.com</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Order Status Update - ${orderData.orderNumber}

Dear ${orderData.customerName},

Your order status has been updated to: ${orderData.newStatus.charAt(0).toUpperCase() + orderData.newStatus.slice(1)}

${statusMessages[orderData.newStatus as keyof typeof statusMessages] || 'Your order status has been updated.'}

You can track your order status anytime by logging into your account.

Questions? Contact us at support@leocosmetics.com

Leo Cosmetics Wholesale
    `;

    return this.sendEmail({
      to: orderData.customerEmail,
      subject: `Order Update - ${orderData.orderNumber}`,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
export default EmailService;