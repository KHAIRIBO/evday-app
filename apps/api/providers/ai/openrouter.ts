import { OpenAICompatibleProvider } from './openai-compatible';

// OpenRouter (openrouter.ai) — real hosted OpenAI-compatible gateway, not
// self-hosted/localhost-only like OmniRoute. HTTP-Referer/X-Title are
// optional but recommended by OpenRouter: they attribute usage to this app
// on their dashboard/leaderboard rather than showing up unlabeled.
export class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, model: string) {
    super('OpenRouter', apiKey, 'https://openrouter.ai/api/v1', model, {
      'HTTP-Referer': 'https://khairibo.app',
      'X-Title': 'khairibo',
    });
  }
}
