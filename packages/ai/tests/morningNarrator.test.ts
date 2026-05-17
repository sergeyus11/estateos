import { describe, it, expect } from 'vitest';
import { buildNarratorPrompt } from '../src/morningNarrator';

describe('buildNarratorPrompt', () => {
  it('mentions all key stats', () => {
    const prompt = buildNarratorPrompt({
      showsToday: 0,
      showsYesterday: 4,
      weekTotal: 18,
      activeAgents: 3,
      topAgent: { name: 'Анна', count: 2 },
      topObject: 'Тверская 12',
      hotProspects: [
        { object: 'Тверская 12', client: 'Петров', reaction: 'хочет срочно' },
      ],
    });
    expect(prompt).toContain('4');
    expect(prompt).toContain('Анна');
    expect(prompt).toContain('Петров');
    expect(prompt).toContain('Тверская');
  });

  it('handles empty day gracefully', () => {
    const prompt = buildNarratorPrompt({
      showsToday: 0,
      showsYesterday: 0,
      weekTotal: 0,
      activeAgents: 2,
      topAgent: null,
      topObject: null,
      hotProspects: [],
    });
    expect(prompt).toContain('пусто');
  });
});
