/** 텍스트를 클립보드에 복사한다. 성공 여부를 반환한다. */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
