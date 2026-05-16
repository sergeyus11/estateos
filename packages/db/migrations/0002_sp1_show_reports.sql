-- SP-1 Voice-отчёт schema

CREATE TYPE "public"."contact_type" AS ENUM('showing', 'whatsapp', 'phone', 'other');
CREATE TYPE "public"."report_status" AS ENUM('draft', 'final');

CREATE TABLE "show_reports" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "agent_id" text NOT NULL,
  "voice_url" text,
  "transcript" text,
  "fields" jsonb NOT NULL,
  "rounds" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "contact_type" "contact_type" NOT NULL DEFAULT 'showing',
  "status" "report_status" NOT NULL DEFAULT 'draft',
  "follow_up_question" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "finalized_at" timestamp with time zone
);

CREATE TABLE "reminder_log" (
  "id" text PRIMARY KEY NOT NULL,
  "agent_id" text NOT NULL,
  "sent_at" timestamp with time zone NOT NULL DEFAULT now(),
  "channel" text NOT NULL,
  "for_date" text NOT NULL
);

CREATE TABLE "push_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth_key" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);

CREATE TABLE "magic_link_invites" (
  "id" text PRIMARY KEY NOT NULL,
  "token" text NOT NULL,
  "email" text NOT NULL,
  "organization_id" text NOT NULL,
  "invited_by_user_id" text NOT NULL,
  "role" "user_role" NOT NULL,
  "first_name" text,
  "last_name" text,
  "telegram_username" text,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "magic_link_invites_token_unique" UNIQUE("token")
);

CREATE TABLE "agent_settings" (
  "user_id" text PRIMARY KEY NOT NULL,
  "day_off_date" text,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "show_reports" ADD CONSTRAINT "show_reports_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "show_reports" ADD CONSTRAINT "show_reports_agent_id_users_id_fk"
  FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_agent_id_users_id_fk"
  FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "magic_link_invites" ADD CONSTRAINT "magic_link_invites_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "magic_link_invites" ADD CONSTRAINT "magic_link_invites_invited_by_user_id_users_id_fk"
  FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION;
ALTER TABLE "agent_settings" ADD CONSTRAINT "agent_settings_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE INDEX "show_reports_org_created_idx" ON "show_reports" ("organization_id", "created_at" DESC);
CREATE INDEX "show_reports_agent_created_idx" ON "show_reports" ("agent_id", "created_at" DESC);
CREATE INDEX "reminder_log_agent_date_idx" ON "reminder_log" ("agent_id", "for_date");
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" ("user_id");
CREATE INDEX "magic_link_invites_org_idx" ON "magic_link_invites" ("organization_id");
