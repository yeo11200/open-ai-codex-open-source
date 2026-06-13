import type { LlmProvider, ProviderId } from './types';
import { anthropicProvider } from './anthropic.provider';
import { ollamaProvider } from './ollama.provider';
import { openAiProvider } from './openai.provider';

/**
 * 프로바이더 레지스트리.
 * 새 프로바이더는 여기에 한 줄 추가하면 전체 앱(Playground·Lens·설정)에 자동 반영된다.
 */
const registry: Record<ProviderId, LlmProvider> = {
  openai: openAiProvider,
  anthropic: anthropicProvider,
  ollama: ollamaProvider,
};

export const PROVIDER_LIST: LlmProvider[] = Object.values(registry);

export const PROVIDER_IDS: ProviderId[] = Object.keys(registry) as ProviderId[];

export const getProvider = (id: ProviderId): LlmProvider => registry[id];
