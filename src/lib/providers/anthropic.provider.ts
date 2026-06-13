import type {
  ChatMessage,
  CompletionParams,
  CompletionResult,
  LlmProvider,
  ProviderCredentials,
  StreamHandler,
} from './types';
import { assertOk, parseSseData, readStreamLines } from './stream';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 1024;

interface AnthropicStreamEvent {
  type: string;
  delta?: { text?: string; stop_reason?: string };
  message?: { usage?: { input_tokens?: number } };
  usage?: { output_tokens?: number };
}

/** Anthropic은 system을 messages 배열이 아닌 최상위 필드로 받는다. */
const splitSystem = (
  messages: ChatMessage[],
): { system: string | undefined; rest: ChatMessage[] } => {
  const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content);
  const rest = messages.filter((m) => m.role !== 'system');
  return {
    system: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
    rest,
  };
};

/**
 * Anthropic Messages 스트리밍 프로바이더.
 * 브라우저 직접 호출 허용 헤더가 필요하며, SSE 이벤트 타입별로 파싱한다.
 */
export const anthropicProvider: LlmProvider = {
  id: 'anthropic',
  label: 'Anthropic',
  defaultModels: [
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-6',
    'claude-opus-4-8',
  ],
  requiresApiKey: true,
  configurableBaseUrl: false,

  async streamChat(
    params: CompletionParams,
    credentials: ProviderCredentials,
    onDelta: StreamHandler,
  ): Promise<CompletionResult> {
    if (!credentials.apiKey) {
      throw new Error('[Anthropic] API 키가 필요합니다. 설정에서 키를 입력하세요.');
    }

    const { system, rest } = splitSystem(params.messages);

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': credentials.apiKey,
        'anthropic-version': API_VERSION,
        // 브라우저에서 직접 호출하기 위한 명시적 허용 헤더
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      signal: params.signal,
      body: JSON.stringify({
        model: params.model,
        system,
        messages: rest,
        max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: params.temperature,
        stream: true,
      }),
    });

    await assertOk(response, 'Anthropic');

    let text = '';
    let finishReason: string | undefined;
    const usage: CompletionResult['usage'] = {};

    for await (const line of readStreamLines(response)) {
      const payload = parseSseData(line);
      if (!payload) continue;

      const event = JSON.parse(payload) as AnthropicStreamEvent;

      if (event.type === 'content_block_delta' && event.delta?.text) {
        text += event.delta.text;
        onDelta(event.delta.text);
      } else if (event.type === 'message_start') {
        usage.promptTokens = event.message?.usage?.input_tokens;
      } else if (event.type === 'message_delta') {
        if (event.delta?.stop_reason) finishReason = event.delta.stop_reason;
        if (event.usage?.output_tokens) usage.completionTokens = event.usage.output_tokens;
      }
    }

    return { text, model: params.model, finishReason, usage };
  },
};
