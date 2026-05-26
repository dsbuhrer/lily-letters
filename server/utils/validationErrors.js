/**
 * Formata erros Zod 4 (issues) para respostas da API e UI.
 * @returns {{ error: string, fields: Record<string, string> }}
 */
export function zodValidationResponse(zodError, fallback = 'Please check the form and try again.') {
  const issues = zodError?.issues || zodError?.errors || [];
  const fields = {};

  for (const issue of issues) {
    const key = issue.path?.[0];
    if (typeof key === 'string' && !fields[key]) {
      fields[key] = issue.message;
    }
  }

  const messages = Object.values(fields);
  const error =
    messages.length === 0
      ? fallback
      : messages.length === 1
        ? messages[0]
        : messages.join(' ');

  return { error, fields };
}
