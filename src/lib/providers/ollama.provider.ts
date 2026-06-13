import type {
  CompletionParams,
  CompletionResult,
  LlmProvider,
  ProviderCredentials,
  StreamHandler,
} from './types';
import { assertOk, readStreamLines } from './stream';

export const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434';

interface OllamaStreamChunk {
  message?: { content?: string };
  done?: boolean;
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * 로컬 Ollama 스트리밍 프로바이더.
 * API 키가 없고 NDJSON(줄 단위 JSON)을 반환한다. 베이스 URL을 설정할 수 있다.
 */
export const ollamaProvider: LlmProvider = {
  id: 'ollama',
  label: 'Ollama (로컬)',
  defaultModels: ['llama3.2', 'qwen2.5', 'gemma3', 'mistral'],
  requiresApiKey: false,
  configurableBaseUrl: true,

  async streamChat(
    params: CompletionParams,
    credentials: ProviderCredentials,
    onDelta: StreamHandler,
  ): Promise<CompletionResult> {
    const baseUrl = (credentials.baseUrl || OLLAMA_DEFAULT_BASE_URL).replace(/\/$/, '');

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: params.signal,
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        stream: true,
        options: { temperature: params.temperature },
      }),
    });

    await assertOk(response, 'Ollama');

    let text = '';
    let finishReason: string | undefined;
    const usage: CompletionResult['usage'] = {};

    for await (const line of readStreamLines(response)) {
      const chunk = JSON.parse(line) as OllamaStreamChunk;

      const delta = chunk.message?.content;
      if (delta) {
        text += delta;
        onDelta(delta);
      }

      if (chunk.done) {
        finishReason = chunk.done_reason ?? 'stop';
        usage.promptTokens = chunk.prompt_eval_count;
        usage.completionTokens = chunk.eval_count;
      }
    }

    return { text, model: params.model, finishReason, usage };
  },
};
