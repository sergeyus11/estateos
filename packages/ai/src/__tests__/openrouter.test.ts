import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getModelForTask } from '../openrouter';
import { computeCostUsd } from '../morningNarrator';

describe('getModelForTask', () => {
  beforeEach(() => {
    delete process.env.LLM_MODEL;
    delete process.env.LLM_MODEL_PARSE;
    delete process.env.LLM_MODEL_BRIEF;
    delete process.env.LLM_MODEL_EXTRACT;
    delete process.env.LLM_MODEL_SUMMARIZE;
    delete process.env.LLM_MODEL_COMMAND;
  });

  it('default = kimi-k2 для backward compat', () => {
    expect(getModelForTask('extract')).toBe('moonshotai/kimi-k2');
    expect(getModelForTask('brief')).toBe('moonshotai/kimi-k2');
  });

  it('LLM_MODEL global override применяется ко всем tasks', () => {
    process.env.LLM_MODEL = 'google/gemini-2.5-flash-lite';
    expect(getModelForTask('extract')).toBe('google/gemini-2.5-flash-lite');
    expect(getModelForTask('summarize')).toBe('google/gemini-2.5-flash-lite');
    expect(getModelForTask('brief')).toBe('google/gemini-2.5-flash-lite');
  });

  it('LLM_MODEL_PARSE task-specific override', () => {
    process.env.LLM_MODEL = 'google/gemini-2.5-flash-lite';
    process.env.LLM_MODEL_PARSE = 'google/gemini-2.5-flash';
    expect(getModelForTask('parse')).toBe('google/gemini-2.5-flash');
    expect(getModelForTask('extract')).toBe('google/gemini-2.5-flash-lite');
  });

  it('LLM_MODEL_BRIEF можно вернуть на kimi для выразительности', () => {
    process.env.LLM_MODEL = 'google/gemini-2.5-flash-lite';
    process.env.LLM_MODEL_BRIEF = 'moonshotai/kimi-k2';
    expect(getModelForTask('brief')).toBe('moonshotai/kimi-k2');
    expect(getModelForTask('extract')).toBe('google/gemini-2.5-flash-lite');
  });
});

describe('llmChat provider routing (smoke)', () => {
  // Tests check that body for moonshotai/* includes provider pin, and for gemini it does not.
  // Uses minimal mock of OpenAI client.
  it('moonshotai/kimi-k2 → provider pin', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    });
    vi.doMock('openai', () => ({
      default: vi.fn(() => ({ chat: { completions: { create: mockCreate } } })),
    }));
    vi.resetModules();
    const { llmChat: freshLlmChat } = await import('../openrouter');
    process.env.OPENROUTER_API_KEY = 'sk-test';

    await freshLlmChat('sys', 'user', { model: 'moonshotai/kimi-k2' });
    expect(mockCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({ provider: { order: ['Novita'], allow_fallbacks: false } }),
    );
  });

  it('google/gemini-2.5-flash-lite → нет provider pin', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    });
    vi.doMock('openai', () => ({
      default: vi.fn(() => ({ chat: { completions: { create: mockCreate } } })),
    }));
    vi.resetModules();
    const { llmChat: freshLlmChat } = await import('../openrouter');
    process.env.OPENROUTER_API_KEY = 'sk-test';

    await freshLlmChat('sys', 'user', { model: 'google/gemini-2.5-flash-lite' });
    const lastCall = mockCreate.mock.lastCall?.[0];
    expect(lastCall).not.toHaveProperty('provider');
  });

  it('llmChat returns LLMChatResult with usage when API returns usage', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 25,
        total_tokens: 125,
      },
    });
    vi.doMock('openai', () => ({
      default: vi.fn(() => ({ chat: { completions: { create: mockCreate } } })),
    }));
    vi.resetModules();
    const { llmChat: freshLlmChat } = await import('../openrouter');
    process.env.OPENROUTER_API_KEY = 'sk-test';

    await expect(
      freshLlmChat('sys', 'user', { model: 'google/gemini-2.5-flash-lite' })
    ).resolves.toEqual({
      text: 'ok',
      usage: {
        promptTokens: 100,
        completionTokens: 25,
        totalTokens: 125,
      },
      model: 'google/gemini-2.5-flash-lite',
    });
  });
});

describe('computeCostUsd', () => {
  it('returns 0 для unknown model (honest zero, not kimi rates)', () => {
    expect(computeCostUsd('unknown/model', { promptTokens: 1000, completionTokens: 500 })).toBe(0);
  });

  it('returns correct cost для kimi-k2', () => {
    // 1M prompt @ $0.4/M + 1M completion @ $0.8/M = $1.2
    expect(
      computeCostUsd('moonshotai/kimi-k2', {
        promptTokens: 1_000_000,
        completionTokens: 1_000_000,
      })
    ).toBeCloseTo(1.2, 5);
  });

  it('returns 0 если usage undefined', () => {
    expect(computeCostUsd('moonshotai/kimi-k2', undefined)).toBe(0);
  });
});
