/**
 * 스트리밍 응답 파싱 공용 유틸.
 * OpenAI/Anthropic은 SSE(`data:` 라인), Ollama는 JSON Lines를 사용하므로
 * "응답 body를 줄 단위로 읽어주는" 최소 공통 분모만 여기서 처리한다.
 */

/** ReadableStream(response.body)을 텍스트 라인 단위로 비동기 순회한다. */
export async function* readStreamLines(
  response: Response,
): AsyncGenerator<string, void, unknown> {
  if (!response.body) {
    throw new Error('응답 본문 스트림이 비어 있습니다.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // 마지막 조각은 다음 청크와 이어질 수 있으므로 버퍼에 남긴다.
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) yield trimmed;
      }
    }

    const tail = buffer.trim();
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}

/** SSE 라인(`data: {...}`)에서 페이로드만 추출한다. `[DONE]`이면 null. */
export function parseSseData(line: string): string | null {
  if (!line.startsWith('data:')) return null;
  const payload = line.slice('data:'.length).trim();
  if (payload === '[DONE]') return null;
  return payload;
}

/** 응답이 실패면 본문을 읽어 의미 있는 에러 메시지로 변환한다. */
export async function assertOk(response: Response, providerLabel: string): Promise<void> {
  if (response.ok) return;

  let detail: string;
  try {
    const body = await response.text();
    detail = body.slice(0, 500);
  } catch {
    detail = response.statusText;
  }

  throw new Error(`[${providerLabel}] 요청 실패 (HTTP ${response.status}) ${detail}`);
}
