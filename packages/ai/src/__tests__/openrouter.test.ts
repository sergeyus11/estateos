import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getModelForTask } from '../openrouter';

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
  it('moonshotai/kimi-k2 → provider: [novita] pin', async () => {
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
      expect.objectContaining({ provider: { order: ['novita'] } }),
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
});
