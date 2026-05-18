import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedUsers() {
  console.log('🌱 Starting seed...\n');

  try {
    // Admin users
    const adminUsers = [
      {
        email: 'admin@leo.com',
        password: 'Admin123!@#',
        business_name: 'Leo Admin',
        contact_phone: '+1 (555) 001-0001',
        role: 'admin'
      }
    ];

    // Wholesaler users
    const wholesalerUsers = [
      {
        email: 'wholesaler1@leo.com',
        password: 'Wholesale123!@#',
        business_name: 'Fashion Forward Retail',
        contact_phone: '+1 (555) 201-0001',
        role: 'wholesaler'
      },
      {
        email: 'wholesaler2@leo.com',
        password: 'Wholesale123!@#',
        business_name: 'Urban Style Co.',
        contact_phone: '+1 (555) 202-0002',
        role: 'wholesaler'
      },
      {
        email: 'wholesaler3@leo.com',
        password: 'Wholesale123!@#',
        business_name: 'Trend Boutique',
        contact_phone: '+1 (555) 203-0003',
        role: 'wholesaler'
      }
    ];

    // Create admin users
    console.log('📝 Creating admin users...');
    for (const user of adminUsers) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true
        });

        if (authError) {
          console.warn(`⚠️  Admin user ${user.email}: ${authError.message}`);
          continue;
        }

        if (authData.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: user.email,
              business_name: user.business_name,
              contact_phone: user.contact_phone
            });

          if (profileError) throw profileError;

          // Assign role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: user.role
            });

          if (roleError) throw roleError;

          console.log(`✅ Admin user created: ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating admin user ${user.email}:`, error);
      }
    }

    // Create wholesaler users
    console.log('\n📝 Creating wholesaler users...');
    for (const user of wholesalerUsers) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true
        });

        if (authError) {
          console.warn(`⚠️  Wholesaler user ${user.email}: ${authError.message}`);
          continue;
        }

        if (authData.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: user.email,
              business_name: user.business_name,
              contact_phone: user.contact_phone
            });

          if (profileError) throw profileError;

          // Assign role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: user.role
            });

          if (roleError) throw roleError;

          console.log(`✅ Wholesaler user created: ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating wholesaler user ${user.email}:`, error);
      }
    }

    // Seed products
    console.log('\n📝 Creating sample products...');
    const products = [
      {
        name: 'MSC Clear Face Cream',
        variant: '50ml',
        size: 'Regular',
        sku: 'MSC-CLEAR-50',
        price: 2500,
        stock: 200
      },
      {
        name: 'MSC Clear Face Cream',
        variant: '100ml',
        size: 'Large',
        sku: 'MSC-CLEAR-100',
        price: 4500,
        stock: 150
      },
      {
        name: 'Vaseline Intensive Care Lotion',
        variant: 'Cocoa Butter',
        size: '400ml',
        sku: 'VAS-COCOA-400',
        price: 2800,
        stock: 180
      },
      {
        name: 'Palmer\'s Cocoa Butter Body Lotion',
        variant: 'Original Formula',
        size: '400ml',
        sku: 'PALM-COCOA-400',
        price: 3200,
        stock: 120
      },
      {
        name: 'Sunscreen SPF 50+',
        variant: 'Clear Gel',
        size: '100ml',
        sku: 'SUN-SPF50-100',
        price: 3800,
        stock: 95
      },
      {
        name: 'Lux Soap Bar',
        variant: 'Rose',
        size: '150g',
        sku: 'LUX-ROSE-150',
        price: 500,
        stock: 500
      },
      {
        name: 'Lux Soap Bar',
        variant: 'Passion & Aloe',
        size: '150g',
        sku: 'LUX-ALOE-150',
        price: 500,
        stock: 450
      },
      {
        name: 'Dettol Antiseptic Cream',
        variant: 'Healing Formula',
        size: '50ml',
        sku: 'DETTOL-HEAL-50',
        price: 1800,
        stock: 220
      },
      {
        name: 'African Shea Butter Hair Cream',
        variant: 'Pure Shea',
        size: '200ml',
        sku: 'SHEA-HAIR-200',
        price: 2200,
        stock: 140
      },
      {
        name: 'Glycerin with Rose Water',
        variant: 'Classic',
        size: '200ml',
        sku: 'GLYC-ROSE-200',
        price: 1500,
        stock: 280
      }
    ];

    for (const product of products) {
      try {
        const { error } = await supabase
          .from('products')
          .insert(product);

        if (error) {
          console.warn(`⚠️  Product ${product.sku}: ${error.message}`);
          continue;
        }

        console.log(`✅ Product created: ${product.sku}`);
      } catch (error) {
        console.error(`❌ Error creating product:`, error);
      }
    }

    console.log('\n✨ Seed complete!');
    console.log('\n📋 Created users:');
    console.log('   Admin:');
    console.log('   - admin@leo.com / Admin123!@#');
    console.log('   \nWholesalers:');
    console.log('   - wholesaler1@leo.com / Wholesale123!@#');
    console.log('   - wholesaler2@leo.com / Wholesale123!@#');
    console.log('   - wholesaler3@leo.com / Wholesale123!@#');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedUsers();
