import { describe, it, expect } from 'vitest';
import { summarizeClient } from '../summarizeClient';

describe('summarizeClient', () => {
  it('returns summary + pref_chips для 3-events client', async () => {
    const result = await summarizeClient(
      {
        name: 'Семья Петровых',
        budgetMin: '12000000',
        budgetMax: '14000000',
        status: 'active',
        preferences: [],
      },
      [
        {
          eventType: 'showing',
          scheduledAt: new Date('2026-05-18T13:30:00Z'),
          title: 'Чкалова 22',
          transcript:
            'Очень понравилось, паркинг есть, готовы к авансу',
        },
      ],
    );
    expect(result.summary.length).toBeGreaterThan(50);
    expect(result.summary).toMatch(/Петров|Чкалова|аванс|паркинг/i);
    expect(result.pref_chips).toBeInstanceOf(Array);
    expect(result.next_step_suggestion).toBeTruthy();
  }, 30000);

  it('handles empty events list gracefully', async () => {
    const result = await summarizeClient(
      {
        name: 'Иванов',
        budgetMin: null,
        budgetMax: null,
        status: 'new',
        preferences: [],
      },
      [],
    );
    expect(result.summary).toContain('новый клиент');
    expect(result.pref_chips).toEqual([]);
  }, 30000);
});
