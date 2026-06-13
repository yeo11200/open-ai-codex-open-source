/**
 * LLM 프로바이더 공통 계약.
 * Playground와 Lens는 이 인터페이스에만 의존하므로, 프로바이더를 추가해도
 * 상위 기능 코드는 바뀌지 않는다 (개방-폐쇄 원칙).
 */

export type ProviderId = 'openai' | 'anthropic' | 'ollama';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CompletionParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** 호출 중단을 위한 AbortSignal */
  signal?: AbortSignal;
}

/** 사용자가 BYOK 방식으로 입력하는 프로바이더 인증 정보 */
export interface ProviderCredentials {
  apiKey?: string;
  /** Ollama·커스텀 게이트웨이용 베이스 URL */
  baseUrl?: string;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  finishReason?: string;
  usage?: TokenUsage;
}

/** 스트리밍 도중 증분 텍스트를 전달받는 콜백 */
export type StreamHandler = (delta: string) => void;

export interface LlmProvider {
  readonly id: ProviderId;
  readonly label: string;
  readonly defaultModels: string[];
  /** false면 로컬 실행 등으로 API 키가 필요 없음 (예: Ollama) */
  readonly requiresApiKey: boolean;
  /** 베이스 URL 입력을 받는 프로바이더인지 (예: Ollama) */
  readonly configurableBaseUrl: boolean;

  /**
   * 스트리밍 채팅 완성을 수행한다.
   * @param onDelta 증분 텍스트가 도착할 때마다 호출
   * @returns 최종 누적 결과
   */
  streamChat(
    params: CompletionParams,
    credentials: ProviderCredentials,
    onDelta: StreamHandler,
  ): Promise<CompletionResult>;
}
