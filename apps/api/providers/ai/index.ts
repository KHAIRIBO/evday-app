export interface AIProvider {
  stream(input: { message: string; context?: string }): Promise<ReadableStream>;
  complete(input: { message: string; context?: string }): Promise<string>;
}

// TODO: implement OpenAIProvider, AnthropicProvider, GeminiProvider and wire
// them in here. Each provider file is a stub until then.
const registry: Record<string, () => AIProvider> = {};

export const getAIProvider = (name = process.env.AI_PROVIDER ?? 'anthropic') => {
  const factory = registry[name];
  if (!factory) throw new Error(`Unknown AI provider: ${name}`);
  return factory();
};
