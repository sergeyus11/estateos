-- SP-3 SPIN-тренажёр schema

CREATE TYPE "public"."training_session_status" AS ENUM('in_progress', 'completed', 'abandoned');

CREATE TABLE "training_personas" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "age_hint" text,
  "budget_hint" text,
  "system_prompt" text NOT NULL,
  "voice_id" text NOT NULL,
  "is_stock" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "training_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "persona_id" text NOT NULL,
  "transcript" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "duration_sec" text,
  "spin_analysis" jsonb,
  "status" "training_session_status" NOT NULL DEFAULT 'in_progress',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone
);

ALTER TABLE "training_personas" ADD CONSTRAINT "training_personas_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_agent_id_users_id_fk"
  FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_persona_id_training_personas_id_fk"
  FOREIGN KEY ("persona_id") REFERENCES "training_personas"("id") ON DELETE RESTRICT;

CREATE INDEX "training_sessions_agent_idx" ON "training_sessions" ("agent_id", "created_at" DESC);
CREATE INDEX "training_sessions_org_idx" ON "training_sessions" ("organization_id", "created_at" DESC);
CREATE INDEX "training_personas_org_idx" ON "training_personas" ("organization_id");
