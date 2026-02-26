-- Manual migration for SaaS fields
-- Run this if prisma db push doesn't work

-- Add missing columns to Tenant table
ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "customDomain" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "databaseName" TEXT NOT NULL DEFAULT 'crm_tenant_default',
ADD COLUMN IF NOT EXISTS "databaseUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS settings JSONB,
ADD COLUMN IF NOT EXISTS limits JSONB,
ADD COLUMN IF NOT EXISTS "billingEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT,
ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Tenant_subdomain_idx" ON "Tenant"(subdomain);
CREATE INDEX IF NOT EXISTS "Tenant_customDomain_idx" ON "Tenant"("customDomain");

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Tenant' 
ORDER BY ordinal_position;
