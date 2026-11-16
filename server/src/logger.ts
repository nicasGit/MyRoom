// JSON escapes line breaks in untrusted fields; one event per stdout line for HAOS.
export function log(event: string, details: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...details }));
}
