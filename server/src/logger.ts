// JSON escapes line breaks in untrusted fields; one event per stdout line for HAOS.
const recent: Record<string, unknown>[] = [];
export function recentLogs() { return recent.slice(); }
export function log(event: string, details: Record<string, unknown> = {}) {
  const entry = { timestamp: new Date().toISOString(), event, ...details };
  recent.push(entry);
  if (recent.length > 100) recent.shift();
  console.log(JSON.stringify(entry));
}
