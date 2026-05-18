import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../openrouter', async () => {
  const actual = await vi.importActual<typeof import('../openrouter')>('../openrouter');
  return {
    ...actual,
    llmChat: vi.fn(),
  };
});

import { classifyVoiceCommand, type VoiceCommandResult } from '../voiceCommand';
import { llmChat } from '../openrouter';

const mockedLlmChat = vi.mocked(llmChat);

function mockClassification(result: VoiceCommandResult): void {
  mockedLlmChat.mockResolvedValueOnce({
    text: JSON.stringify(result),
    model: 'test-model',
  });
}

describe('classifyVoiceCommand', () => {
  beforeEach(() => {
    mockedLlmChat.mockReset();
  });

  it.each([
    'поставь показ Иванову завтра в 15',
    'создай встречу с собственником в среду в десять',
    'запланируй звонок Анне сегодня вечером',
    'добавь задачу отправить договор Петровым до конца дня',
    'назначь показ квартиры на Чкалова в пятницу в 12',
  ])('classifies create_event: %s', async (transcript: string) => {
    mockClassification({
      intent: 'create_event',
      confidence: 0.86,
      payload: { delegate_to: 'parseEventCommand' },
    });

    const result = await classifyVoiceCommand(transcript, 'agent_home');

    expect(result?.intent).toBe('create_event');
    expect(result?.payload.delegate_to).toBe('parseEventCommand');
    expect(mockedLlmChat).toHaveBeenCalledWith(
      expect.stringContaining('классификатор голосовых команд'),
      expect.stringContaining(transcript),
      expect.objectContaining({
        task: 'command',
        temperature: 0.2,
        maxTokens: 400,
        responseFormat: 'json_object',
      }),
    );
  });

  it.each([
    {
      transcript: 'покажи клиентов с бюджетом до 15 миллионов',
      entity: 'clients',
      filterText: 'бюджетом до 15 миллионов',
    },
    {
      transcript: 'найди клиентов Анна',
      entity: 'clients',
      filterText: 'Анна',
    },
    {
      transcript: 'найди все коммерческие объекты до 10 миллионов',
      entity: 'objects',
      filterText: 'коммерческие до 10 миллионов',
    },
    {
      transcript: 'покажи объекты на Чкалова',
      entity: 'objects',
      filterText: 'Чкалова',
    },
    // NB: 'events' entity was removed from the voiceCommand prompt in review-fix iter 1
    // (see prompts/voiceCommand.ts). This test verifies that the classifier can still
    // pass through 'events' from raw LLM JSON, but the route.ts searchEntities returns
    // [] for it (no events search implementation). If 'events' search is added later,
    // re-enable this case as a proper integration test.
    {
      transcript: 'найди события на завтра',
      entity: 'events',
      filterText: 'завтра',
    },
  ])(
    'classifies search: $transcript',
    async ({
      transcript,
      entity,
      filterText,
    }: {
      transcript: string;
      entity: string;
      filterText: string;
    }) => {
      mockClassification({
        intent: 'search',
        confidence: 0.79,
        payload: { entity, filter_text: filterText },
      });

      const result = await classifyVoiceCommand(transcript, 'agent_home');

      expect(result?.intent).toBe('search');
      expect(result?.payload.entity).toBe(entity);
      expect(result?.payload.filter_text).toBe(filterText);
    },
  );

  it.each([
    {
      transcript: 'отправь Анне подборку',
      client: 'Анна',
      templateHint: 'подборка',
    },
    {
      transcript: 'напиши Иванову что переносим показ',
      client: 'Иванов',
      templateHint: 'перенос показа',
    },
    {
      transcript: 'отправь Петровым напоминание о встрече завтра',
      client: 'Петровы',
      templateHint: 'напоминание о встрече завтра',
    },
    {
      transcript: 'пришли клиенту сообщение с документами',
      client: 'клиент',
      templateHint: 'документы',
    },
    {
      transcript: 'напиши Марии что объект снова доступен',
      client: 'Мария',
      templateHint: 'объект снова доступен',
    },
  ])(
    'classifies send_template: $transcript',
    async ({
      transcript,
      client,
      templateHint,
    }: {
      transcript: string;
      client: string;
      templateHint: string;
    }) => {
      mockClassification({
        intent: 'send_template',
        confidence: 0.83,
        payload: { client_name_or_id: client, template_hint: templateHint },
      });

      const result = await classifyVoiceCommand(transcript, 'client_detail');

      expect(result?.intent).toBe('send_template');
      expect(result?.payload.client_name_or_id).toBe(client);
      expect(result?.payload.template_hint).toBe(templateHint);
    },
  );

  it.each([
    'сколько у меня показов завтра',
    'есть ли свободное время в среду',
    'что у меня сегодня по плану',
    'кто из клиентов давно без контакта',
    'какой следующий шаг по Анне',
  ])('classifies generic: %s', async (transcript: string) => {
    mockClassification({
      intent: 'generic',
      confidence: 0.72,
      payload: { question: transcript },
    });

    const result = await classifyVoiceCommand(transcript, 'agenda');

    expect(result?.intent).toBe('generic');
    expect(result?.payload.question).toBe(transcript);
  });
});
