CREATE TYPE "public"."client_status" AS ENUM('new', 'active', 'thinking', 'negotiating', 'closed_won', 'closed_lost');
CREATE TYPE "public"."property_type" AS ENUM('flat', 'commercial', 'house', 'land');
CREATE TYPE "public"."object_status" AS ENUM('active', 'reserved', 'sold', 'withdrawn');
CREATE TYPE "public"."event_type" AS ENUM('showing', 'meeting', 'call', 'task');
CREATE TYPE "public"."event_status" AS ENUM('planned', 'in_progress', 'done', 'cancelled');
CREATE TYPE "public"."event_source" AS ENUM('manual', 'voice', 'auto_from_report', 'backfill');

CREATE TABLE "clients" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "created_by_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE no action,
  "name" text NOT NULL,
  "phone" text,
  "telegram" text,
  "email" text,
  "budget_min" numeric,
  "budget_max" numeric,
  "preferences" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "ai_summary" text,
  "ai_summary_updated_at" timestamp with time zone,
  "status" "client_status" NOT NULL DEFAULT 'new',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "objects" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "created_by_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE no action,
  "title" text NOT NULL,
  "address" text NOT NULL,
  "price" numeric,
  "property_type" "property_type" NOT NULL,
  "rooms" integer,
  "area" numeric,
  "photos" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "owner_name" text,
  "owner_phone" text,
  "status" "object_status" NOT NULL DEFAULT 'active',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE "agenda_events" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "agent_id" text NOT NULL REFERENCES "users"("id") ON DELETE no action,
  "event_type" "event_type" NOT NULL,
  "title" text NOT NULL,
  "scheduled_at" timestamp with time zone NOT NULL,
  "duration_min" integer NOT NULL DEFAULT 30,
  "client_id" text REFERENCES "clients"("id") ON DELETE set null,
  "object_id" text REFERENCES "objects"("id") ON DELETE set null,
  "address" text,
  "status" "event_status" NOT NULL DEFAULT 'planned',
  "report_id" text REFERENCES "show_reports"("id") ON DELETE set null,
  "notes" text,
  "source" "event_source" NOT NULL DEFAULT 'manual',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "show_reports" ADD COLUMN "event_id" text;
ALTER TABLE "show_reports" ADD COLUMN "client_id" text;
ALTER TABLE "show_reports" ADD CONSTRAINT "show_reports_event_id_agenda_events_id_fk"
  FOREIGN KEY ("event_id") REFERENCES "agenda_events"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "show_reports" ADD CONSTRAINT "show_reports_client_id_clients_id_fk"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "clients_org_idx" ON "clients" ("organization_id");
CREATE INDEX "clients_agent_idx" ON "clients" ("created_by_user_id");
CREATE INDEX "clients_status_idx" ON "clients" ("status");
CREATE INDEX "objects_org_idx" ON "objects" ("organization_id");
CREATE INDEX "objects_status_idx" ON "objects" ("status");
CREATE INDEX "objects_type_idx" ON "objects" ("property_type");
CREATE INDEX "agenda_agent_scheduled_idx" ON "agenda_events" ("agent_id", "scheduled_at");
CREATE INDEX "agenda_org_idx" ON "agenda_events" ("organization_id");
CREATE INDEX "agenda_status_idx" ON "agenda_events" ("status");
CREATE INDEX "agenda_client_idx" ON "agenda_events" ("client_id");
CREATE INDEX "show_reports_event_id_idx" ON "show_reports" ("event_id");
CREATE INDEX "show_reports_client_id_idx" ON "show_reports" ("client_id");
