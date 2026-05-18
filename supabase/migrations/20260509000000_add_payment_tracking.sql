-- Add payment tracking to orders
-- Migration: 20260509000000_add_payment_tracking.sql

-- Create payment method enum if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM ('pickup', 'bank_transfer');
  END IF;
END$$;

-- Create payment status enum if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'awaiting_verification', 'paid', 'rejected');
  END IF;
END$$;

-- Add payment columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method payment_method NOT NULL DEFAULT 'pickup',
ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;

-- Create checkout_v1 RPC function
CREATE OR REPLACE FUNCTION public.checkout_v1(
  p_user_id UUID,
  p_items JSONB,
  p_payment_method payment_method,
  p_delivery_type delivery_type,
  p_receipt_url TEXT DEFAULT NULL,
  p_delivery_address TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_total NUMERIC(10,2) := 0;
  v_item RECORD;
  v_product RECORD;
  v_insufficient_stock TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User ID is required');
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No items in cart');
  END IF;

  IF p_payment_method = 'bank_transfer' AND (p_receipt_url IS NULL OR p_receipt_url = '') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Receipt URL is required for bank transfer');
  END IF;

  -- Start transaction and lock products
  -- Loop through items to lock products and validate stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Lock the product row
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item.value->>'product_id')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Product not found: ' || (v_item.value->>'product_id'));
    END IF;

    IF v_product.stock < (v_item.value->>'quantity')::INTEGER THEN
      v_insufficient_stock := array_append(v_insufficient_stock, v_product.name || ' (available: ' || v_product.stock || ')');
    END IF;

    -- Accumulate total
    v_total := v_total + (v_product.price * (v_item.value->>'quantity')::INTEGER);
  END LOOP;

  -- Check if any insufficient stock
  IF array_length(v_insufficient_stock, 1) > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock for: ' || array_to_string(v_insufficient_stock, ', '));
  END IF;

  -- Create order
  INSERT INTO orders (
    user_id,
    total,
    delivery_type,
    delivery_address,
    payment_method,
    payment_status,
    receipt_url,
    notes
  ) VALUES (
    p_user_id,
    v_total,
    p_delivery_type,
    p_delivery_address,
    p_payment_method,
    CASE WHEN p_payment_method = 'pickup' THEN 'paid'::payment_status ELSE 'awaiting_verification'::payment_status END,
    p_receipt_url,
    p_notes
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  -- Create order items and decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get product again (already locked)
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item.value->>'product_id')::UUID;

    -- Insert order item
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      variant,
      size,
      sku,
      unit_price,
      quantity,
      subtotal
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.variant,
      v_product.size,
      v_product.sku,
      v_product.price,
      (v_item.value->>'quantity')::INTEGER,
      v_product.price * (v_item.value->>'quantity')::INTEGER
    );

    -- Decrement stock
    UPDATE products
    SET stock = stock - (v_item.value->>'quantity')::INTEGER,
        updated_at = now()
    WHERE id = v_product.id;
  END LOOP;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.checkout_v1(UUID, JSONB, payment_method, delivery_type, TEXT, TEXT, TEXT) TO authenticated;

-- Add updated_at trigger to orders if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'set_updated_at_orders'
      AND event_object_table = 'orders'
  ) THEN
    CREATE TRIGGER set_updated_at_orders
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;