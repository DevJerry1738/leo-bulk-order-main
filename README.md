# Leo Cosmetics Wholesale Ordering System

A modern, full-featured wholesale ordering platform built with React, TypeScript, and Supabase.

## ✅ Completed Features

### Phase 1-5: Core Functionality
- ✅ User authentication and authorization
- ✅ Product catalog with search and filtering
- ✅ Shopping cart with quantity management
- ✅ Checkout process with multiple payment methods
- ✅ Order management for customers and admins
- ✅ Bank transfer payment with receipt upload
- ✅ Admin product and order management
- ✅ Enhanced order tracking with payment status
- ✅ Improved checkout progress styling

### Phase 6: Email Notifications & Analytics
- ✅ **Email Notifications System**
  - Order confirmation emails with detailed order information
  - Status update emails when orders progress
  - Professional HTML email templates
  - SMTP configuration for reliable delivery
- ✅ **Admin Dashboard**
  - Business analytics and key metrics
  - Recent orders overview
  - Revenue and order statistics
  - Visual dashboard with cards and charts

### Phase 7: Advanced Pricing & Discounts
- ✅ **Bulk Pricing Tiers**
  - Quantity-based pricing tiers per product
  - Percentage discount or override pricing options
  - Real-time savings calculation
  - Visual tier display in product listing
- ✅ **Discount Code System**
  - Create percentage-based or fixed-amount discount codes
  - Set minimum order values and usage limits
  - Scheduled discounts with start/end dates
  - Code validation and application at checkout
- ✅ **Admin Pricing Management**
  - Dedicated pricing management interface
  - Easy tier and code creation/deletion
  - Real-time discount code tracking

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see SETUP_GUIDE.md)
4. Run database migrations
5. Start development server: `npm run dev`

## 📧 Email Configuration

Configure SMTP settings in `.env`:

```env
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=noreply@leocosmetics.com
VITE_SMTP_PASS=your_smtp_password_here
VITE_FROM_EMAIL=noreply@leocosmetics.com
VITE_FROM_NAME=Leo Cosmetics
```

## 💰 Pricing Management

### Setting Up Bulk Pricing Tiers
1. Navigate to Admin → Pricing → Bulk Pricing Tiers
2. Select a product
3. Add pricing tiers with minimum quantities
4. Choose either price override or discount percentage
5. Prices update automatically based on cart quantity

### Creating Discount Codes
1. Navigate to Admin → Pricing → Discount Codes
2. Create a code with:
   - Code name (e.g., SUMMER20)
   - Discount type (percentage or fixed amount)
   - Optional minimum order value
   - Optional usage limits and date ranges
3. Customers can apply codes during checkout

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Email**: Nodemailer with SMTP
- **Build**: Vite
- **State**: React Query, Context API

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run seed` - Seed database with sample data
- `npm run test` - Run tests
