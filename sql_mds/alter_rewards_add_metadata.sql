-- Add richer metadata to rewards table
ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_instructions TEXT,
  ADD COLUMN IF NOT EXISTS estimated_fulfillment_time TEXT,
  ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quantity INTEGER;

-- Ensure auto_approve defaults to false for existing records
UPDATE rewards
SET
  auto_approve = COALESCE(auto_approve, false),
  is_recurring = COALESCE(is_recurring, false),
  quantity = COALESCE(quantity, NULL);
