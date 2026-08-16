export interface AIProvider {
  stream(input: { message: string; context?: string }): Promise<ReadableStream>;
  complete(input: { message: string; context?: string }): Promise<string>;
}

import { AnthropicProvider } from './anthropic';
import { OmniRouteProvider } from './omniroute';
import { OpenRouterProvider } from './openrouter';
// TODO: openai.ts (direct), gemini.ts — not implemented. ANTHROPIC_API_KEY,
// OMNIROUTE_API_KEY, and OPENROUTER_API_KEY are wired up; other
// AI_PROVIDER values throw below.

const registry: Record<string, () => AIProvider> = {
  anthropic: () => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
    return new AnthropicProvider(key);
  },
  omniroute: () => {
    const key = process.env.OMNIROUTE_API_KEY;
    if (!key) throw new Error('OMNIROUTE_API_KEY is not set');
    const baseUrl = process.env.OMNIROUTE_BASE_URL ?? 'http://localhost:20128/v1';
    const model = process.env.OMNIROUTE_MODEL;
    if (!model) throw new Error('OMNIROUTE_MODEL is not set — pick a model configured in your OmniRoute dashboard');
    return new OmniRouteProvider(key, baseUrl, model);
  },
  openrouter: () => {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error('OPENROUTER_API_KEY is not set');
    // Unlike OmniRoute's arbitrary self-hosted config, OpenRouter has a
    // stable public model catalog — safe to default rather than require
    // manual setup. Overridable per-deployment via OPENROUTER_MODEL.
    const model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';
    return new OpenRouterProvider(key, model);
  },
};

export const getAIProvider = (name = process.env.AI_PROVIDER ?? 'anthropic') => {
  const factory = registry[name];
  if (!factory) throw new Error(`Unknown or unimplemented AI provider: ${name}`);
  return factory();
};
