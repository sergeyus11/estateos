-- Rename verification_tokens.token → value (Better-Auth canonical field name)
ALTER TABLE "verification_tokens" RENAME COLUMN "token" TO "value";
ALTER TABLE "verification_tokens" DROP CONSTRAINT IF EXISTS "verification_tokens_token_unique";

-- Add updated_at (Better-Auth canonical)
ALTER TABLE "verification_tokens" ADD COLUMN "updated_at" timestamp with time zone NOT NULL DEFAULT now();
