import { OpenAICompatibleProvider } from './openai-compatible';

// OmniRoute is just an OpenAI-compatible chat-completions gateway — see
// openai-compatible.ts for the actual request/SSE logic shared with the
// OpenRouter provider.
export class OmniRouteProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, baseUrl: string, model: string) {
    super('OmniRoute', apiKey, baseUrl, model);
  }
}
