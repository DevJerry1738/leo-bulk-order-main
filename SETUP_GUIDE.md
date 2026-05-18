# Leo Bulk Order - Project Setup Guide

## ✅ Completed Steps

- [x] Updated `.env.local` with Supabase credentials
- [x] Installed dependencies (npm packages)
- [x] Created seed script (`src/scripts/seed.ts`)
- [x] Added npm scripts for seeding

## 📋 Next Steps

### Step 1: Get Supabase Service Role Key
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `fbnmyvnkupdzradydqqx`
3. Navigate to **Settings → API**
4. Find the **Service Role Key** (Secret)
5. Copy this key

### Step 2: Create `.env` file with Service Role Key
Create a file named `.env` in the project root with:

```env
VITE_SUPABASE_URL=https://fbnmyvnkupdzradydqqx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Fv7DePn_fdqfR8cm5jPjmQ_QsXAnIm5
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 3: Push Database Migrations
Option A - Using Supabase Web Dashboard:
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the migration files from `supabase/migrations/` folder
6. Run each migration

Option B - Using Supabase CLI (if installed):
```bash
supabase link --project-ref fbnmyvnkupdzradydqqx
supabase db push
```

### Step 4: Run the Seed Script
After migrations are applied and `.env` file is created:

```bash
npm run seed
```

This will create:
- ✅ 1 Admin user
- ✅ 3 Wholesaler users
- ✅ 10 Sample products

### Default Test Accounts

After seeding, you can login with:

**Admin Account:**
- Email: `admin@leo.com`
- Password: `Admin123!@#`

**Wholesaler Accounts:**
- Email: `wholesaler1@leo.com` | Password: `Wholesale123!@#`
- Email: `wholesaler2@leo.com` | Password: `Wholesale123!@#`
- Email: `wholesaler3@leo.com` | Password: `Wholesale123!@#`

## 🚀 Start Development

Once everything is set up:

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run seed` - Seed database with initial data
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Check code quality
