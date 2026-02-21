ALTER TABLE pricing
  ADD COLUMN IF NOT EXISTS custom_package_quantity integer,
  ADD COLUMN IF NOT EXISTS custom_package_price numeric,
  ADD COLUMN IF NOT EXISTS is_custom_package boolean DEFAULT false;