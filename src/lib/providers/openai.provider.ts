import type {
  CompletionParams,
  CompletionResult,
  LlmProvider,
  ProviderCredentials,
  StreamHandler,
} from './types';
import { assertOk, parseSseData, readStreamLines } from './stream';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

interface OpenAiStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
}

/**
 * OpenAI Chat Completions 스트리밍 프로바이더.
 * 브라우저에서 직접 호출하며(BYOK), SSE `data:` 라인을 파싱한다.
 */
export const openAiProvider: LlmProvider = {
  id: 'openai',
  label: 'OpenAI',
  defaultModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o4-mini'],
  requiresApiKey: true,
  configurableBaseUrl: false,

  async streamChat(
    params: CompletionParams,
    credentials: ProviderCredentials,
    onDelta: StreamHandler,
  ): Promise<CompletionResult> {
    if (!credentials.apiKey) {
      throw new Error('[OpenAI] API 키가 필요합니다. 설정에서 키를 입력하세요.');
    }

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credentials.apiKey}`,
      },
      signal: params.signal,
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_completion_tokens: params.maxTokens,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    await assertOk(response, 'OpenAI');

    let text = '';
    let finishReason: string | undefined;
    const usage: CompletionResult['usage'] = {};

    for await (const line of readStreamLines(response)) {
      const payload = parseSseData(line);
      if (!payload) continue;

      const chunk = JSON.parse(payload) as OpenAiStreamChunk;
      const choice = chunk.choices?.[0];

      const delta = choice?.delta?.content;
      if (delta) {
        text += delta;
        onDelta(delta);
      }

      if (choice?.finish_reason) finishReason = choice.finish_reason;
      if (chunk.usage) {
        usage.promptTokens = chunk.usage.prompt_tokens;
        usage.completionTokens = chunk.usage.completion_tokens;
      }
    }

    return { text, model: params.model, finishReason, usage };
  },
};
