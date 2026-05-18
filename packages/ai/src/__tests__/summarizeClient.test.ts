import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../openrouter', () => ({
  llmChat: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      summary: 'Семья Петровых на показе Чкалова 22 готовы к авансу.',
      pref_chips: ['паркинг', 'аванс'],
      next_step_suggestion: 'Оформить аванс на этой неделе.',
    }),
    model: 'google/gemini-2.5-flash',
  }),
  extractJSON: <T>(raw: string): T | null => {
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
}));

import { summarizeClient } from '../summarizeClient';

describe('summarizeClient', () => {
  beforeEach(async () => {
    const { llmChat } = await import('../openrouter');
    vi.mocked(llmChat).mockResolvedValue({
      text: JSON.stringify({
        summary: 'Семья Петровых на показе Чкалова 22 готовы к авансу.',
        pref_chips: ['паркинг', 'аванс'],
        next_step_suggestion: 'Оформить аванс на этой неделе.',
      }),
      model: 'google/gemini-2.5-flash',
    });
  });

  it('returns parsed summary from LLM (happy path)', async () => {
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
    expect(result.summary).toContain('Петров');
    expect(result.pref_chips).toEqual(['паркинг', 'аванс']);
    expect(result.next_step_suggestion).toBeTruthy();
  });

  it('handles empty events list (no LLM call, early return)', async () => {
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
  });

  it('LLM JSON parse failure → graceful fallback', async () => {
    const { llmChat } = await import('../openrouter');
    vi.mocked(llmChat).mockResolvedValueOnce({ text: 'not valid json', model: 'test' });
    const result = await summarizeClient(
      {
        name: 'Тест',
        budgetMin: null,
        budgetMax: null,
        status: 'active',
        preferences: ['паркинг'],
      },
      [
        {
          eventType: 'call',
          scheduledAt: new Date('2026-05-18T10:00:00Z'),
          title: 'Звонок',
          transcript: 'okay',
        },
      ],
    );
    expect(result.summary).toContain('не сгенерировано');
    expect(result.pref_chips).toEqual(['паркинг']);
  });
});
