import { pgTable, text, timestamp, boolean, pgEnum, jsonb, integer, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRole = pgEnum('user_role', ['admin', 'agent']);
export const contactType = pgEnum('contact_type', ['showing', 'whatsapp', 'phone', 'other']);
export const reportStatus = pgEnum('report_status', ['draft', 'final']);

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  telegramUsername: text('telegram_username'),
  telegramChatId: text('telegram_chat_id'),
  role: userRole('role').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  emailVerified: boolean('email_verified').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const verificationTokens = pgTable('verification_tokens', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type ReportFields = {
  object: string | null;
  client: string | null;
  budget: string | null;
  reaction: string | null;
  nextStep: string | null;
};

export type ReportRound = {
  transcript: string;
  question: string | null;
  answer: string | null;
  ts: string;
};

export const showReports = pgTable('show_reports', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  agentId: text('agent_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  voiceUrl: text('voice_url'),
  transcript: text('transcript'),
  fields: jsonb('fields').notNull().$type<ReportFields>(),
  rounds: jsonb('rounds').notNull().default([]).$type<ReportRound[]>(),
  contactType: contactType('contact_type').notNull().default('showing'),
  status: reportStatus('status').notNull().default('draft'),
  followUpQuestion: text('follow_up_question'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
});

export const reminderLog = pgTable('reminder_log', {
  id: text('id').primaryKey(),
  agentId: text('agent_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().default(sql`now()`),
  channel: text('channel').notNull(),
  forDate: text('for_date').notNull(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  authKey: text('auth_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const magicLinkInvites = pgTable('magic_link_invites', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  email: text('email').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  invitedByUserId: text('invited_by_user_id')
    .notNull()
    .references(() => users.id),
  role: userRole('role').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  telegramUsername: text('telegram_username'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const agentSettings = pgTable('agent_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  dayOffDate: text('day_off_date'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const trainingSessionStatus = pgEnum('training_session_status', [
  'in_progress',
  'completed',
  'abandoned',
]);

export type TrainingTurn = {
  role: 'agent' | 'client';
  text: string;
  audioUrl: string | null;
  ts: string;
};

export type SpinAnalysis = {
  situation: number;
  problem: number;
  implication: number;
  needPayoff: number;
  score: number;
  feedback: string;
};

export const trainingPersonas = pgTable('training_personas', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  ageHint: text('age_hint'),
  budgetHint: text('budget_hint'),
  systemPrompt: text('system_prompt').notNull(),
  voiceId: text('voice_id').notNull(),
  isStock: boolean('is_stock').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const trainingSessions = pgTable('training_sessions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  agentId: text('agent_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  personaId: text('persona_id')
    .notNull()
    .references(() => trainingPersonas.id, { onDelete: 'restrict' }),
  transcript: jsonb('transcript').notNull().default([]).$type<TrainingTurn[]>(),
  durationSec: text('duration_sec'),
  spinAnalysis: jsonb('spin_analysis').$type<SpinAnalysis | null>(),
  status: trainingSessionStatus('status').notNull().default('in_progress'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const narrativeStatus = pgEnum('narrative_status', [
  'pending',
  'generating',
  'ready',
  'error',
]);

export type NarrativeStats = {
  showsToday: number;
  showsYesterday: number;
  weekTotal: number;
  activeAgents: number;
  topAgent: { name: string; count: number } | null;
  topObject: string | null;
  hotProspects: Array<{ object: string; client: string; reaction: string }>;
};

export const morningNarratives = pgTable('morning_narratives', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  adminId: text('admin_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  periodDate: text('period_date').notNull(),
  narrativeText: text('narrative_text'),
  audioPath: text('audio_path'),
  audioDurationSec: integer('audio_duration_sec'),
  stats: jsonb('stats').notNull().default({}).$type<NarrativeStats>(),
  status: narrativeStatus('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  costUsd: numeric('cost_usd', { precision: 10, scale: 5 }),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  listenedAt: timestamp('listened_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type MorningNarrative = typeof morningNarratives.$inferSelect;
export type NewMorningNarrative = typeof morningNarratives.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ShowReport = typeof showReports.$inferSelect;
export type NewShowReport = typeof showReports.$inferInsert;
export type MagicLinkInvite = typeof magicLinkInvites.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type TrainingPersona = typeof trainingPersonas.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
