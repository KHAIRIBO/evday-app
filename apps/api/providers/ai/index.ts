export interface AIProvider {
  stream(input: { message: string; context?: string }): Promise<ReadableStream>;
  complete(input: { message: string; context?: string }): Promise<string>;
}

import { AnthropicProvider } from './anthropic';
import { OmniRouteProvider } from './omniroute';
// TODO: openai.ts, gemini.ts — not implemented. Only ANTHROPIC_API_KEY and
// OMNIROUTE_API_KEY are wired up; other AI_PROVIDER values throw below.

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
};

export const getAIProvider = (name = process.env.AI_PROVIDER ?? 'anthropic') => {
  const factory = registry[name];
  if (!factory) throw new Error(`Unknown or unimplemented AI provider: ${name}`);
  return factory();
};
