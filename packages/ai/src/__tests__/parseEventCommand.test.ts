import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../openrouter', async () => {
  const actual = await vi.importActual<typeof import('../openrouter')>('../openrouter');
  return {
    ...actual,
    llmChat: vi.fn(),
  };
});

import { parseEventCommand, type ParseEventInput, type ParsedEvent } from '../parseEventCommand';
import { llmChat } from '../openrouter';

const mockedLlmChat = vi.mocked(llmChat);

const baseInput: Omit<ParseEventInput, 'transcript'> = {
  today_iso: '2026-05-18T09:00:00+03:00',
  agent_name: 'agent@example.com',
  client_list: [
    { id: 'client-petrov', name: 'Петровы' },
    { id: 'client-zharikov', name: 'Жариковы' },
    { id: 'client-anna', name: 'Анна' },
  ],
  object_list: [{ id: 'object-chkalova', title: 'Квартира на Чкалова', address: 'Чкалова 22' }],
};

function mockParsedEvent(event: ParsedEvent): void {
  mockedLlmChat.mockResolvedValueOnce({
    text: JSON.stringify(event),
    model: 'test-model',
  });
}

async function parseTranscript(transcript: string): Promise<ParsedEvent | null> {
  return parseEventCommand({
    ...baseInput,
    transcript,
  });
}

describe('parseEventCommand', () => {
  beforeEach(() => {
    mockedLlmChat.mockReset();
  });

  it('parses showing command', async () => {
    mockParsedEvent({
      event_type: 'showing',
      title: 'Показ Петровым',
      scheduled_at_iso: '2026-05-19T15:00:00+03:00',
      duration_min: 30,
      client_match: { id: 'client-petrov' },
      object_match: { id: 'object-chkalova' },
      address: 'Чкалова 22',
      confidence: 0.86,
    });

    const result = await parseTranscript('поставь показ Петровым завтра в 15 на Чкалова 22');

    expect(result?.event_type).toBe('showing');
    expect(result?.confidence).toBeGreaterThan(0.6);
  });

  it('parses meeting command', async () => {
    mockParsedEvent({
      event_type: 'meeting',
      title: 'Встреча с собственником в офисе',
      scheduled_at_iso: '2026-05-20T10:00:00+03:00',
      duration_min: 30,
      client_match: null,
      object_match: null,
      address: 'офис',
      confidence: 0.78,
    });

    const result = await parseTranscript('встреча в офисе в среду в 10 утра с собственником');

    expect(result?.event_type).toBe('meeting');
  });

  it('parses call command', async () => {
    mockParsedEvent({
      event_type: 'call',
      title: 'Перезвонить Жариковым',
      scheduled_at_iso: '2026-05-22T11:00:00+03:00',
      duration_min: 30,
      client_match: { id: 'client-zharikov' },
      object_match: null,
      address: null,
      confidence: 0.82,
    });

    const result = await parseTranscript('перезвонить Жариковым в пятницу в 11');

    expect(result?.event_type).toBe('call');
  });

  it('parses task command', async () => {
    mockParsedEvent({
      event_type: 'task',
      title: 'Отправить подборку Анне',
      scheduled_at_iso: '2026-05-18T18:00:00+03:00',
      duration_min: 30,
      client_match: { id: 'client-anna' },
      object_match: null,
      address: null,
      confidence: 0.74,
    });

    const result = await parseTranscript('отправить подборку Анне до конца дня');

    expect(result?.event_type).toBe('task');
  });

  it('returns low confidence for unclear command', async () => {
    mockParsedEvent({
      event_type: 'task',
      title: '',
      scheduled_at_iso: '2026-05-18T18:00:00+03:00',
      duration_min: 30,
      client_match: null,
      object_match: null,
      address: null,
      confidence: 0.21,
    });

    const result = await parseTranscript('бла бла что-то непонятное хрюк');

    expect(result?.confidence).toBeLessThan(0.4);
  });
});
