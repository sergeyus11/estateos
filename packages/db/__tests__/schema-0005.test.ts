import { describe, it, expect } from 'vitest';
import {
  clients, objects, agendaEvents,
  clientStatus, propertyType, objectStatus,
  eventType, eventStatus, eventSource,
} from '../src/schema';

describe('schema 0005', () => {
  it('clients table has correct columns', () => {
    const cols = Object.keys(clients);
    expect(cols).toContain('id');
    expect(cols).toContain('organizationId');
    expect(cols).toContain('name');
    expect(cols).toContain('aiSummary');
    expect(cols).toContain('preferences');
    expect(cols).toContain('status');
  });

  it('objects table has photo-array column', () => {
    const cols = Object.keys(objects);
    expect(cols).toContain('photos');
    expect(cols).toContain('propertyType');
  });

  it('agendaEvents has FK columns to clients, objects, users, showReports', () => {
    const cols = Object.keys(agendaEvents);
    expect(cols).toContain('clientId');
    expect(cols).toContain('objectId');
    expect(cols).toContain('reportId');
    expect(cols).toContain('agentId');
  });

  it('client_status enum has 6 values', () => {
    expect(clientStatus.enumValues).toEqual([
      'new', 'active', 'thinking', 'negotiating', 'closed_won', 'closed_lost',
    ]);
  });

  it('event_type enum has 4 values', () => {
    expect(eventType.enumValues).toEqual(['showing', 'meeting', 'call', 'task']);
  });

  it('event_source includes backfill', () => {
    expect(eventSource.enumValues).toContain('backfill');
  });
});
