const events = new Set([
  'session_requested', 'session_started', 'session_ended', 'session_error',
  'placement_requested', 'placement_accepted', 'placement_rejected', 'placement_timeout',
  'calibration_reset', 'calibration_completed', 'tracking_changed',
]);
export function parseXREvent(value: unknown): { event: string; details: Record<string, unknown> } | undefined {
  if (!value || typeof value !== 'object' || !('type' in value) || value.type !== 'xr_event' || !('event' in value) || typeof value.event !== 'string' || !events.has(value.event)) return;
  if (!('details' in value) || !value.details || typeof value.details !== 'object' || Array.isArray(value.details)) return;
  const details: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value.details)) {
    if (key === 'step' && (item === 'A' || item === 'B')) details[key] = item;
    else if (key === 'reason' && typeof item === 'string' && item.length <= 160) details[key] = item;
    else if (key === 'overlay' && typeof item === 'boolean') details[key] = item;
    else if (['x', 'y', 'z', 'viewerHeight', 'directionY', 'distance'].includes(key) && typeof item === 'number' && Number.isFinite(item) && Math.abs(item) <= 10000) details[key] = item;
    else return;
  }
  return { event: value.event, details };
}
