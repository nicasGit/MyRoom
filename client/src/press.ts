// Act at first contact, before tracking can be disrupted by the touch.
export function bindPress(target: EventTarget, action: () => void, now = () => performance.now()) {
  let pointerAt = -Infinity;
  let down = false;
  const primary = (event: Event) => {
    const input = event as PointerEvent;
    return input.isPrimary !== false && (input.button === undefined || input.button === 0);
  };
  const start = (event: Event) => {
    if (!primary(event)) return;
    down = true;
    pointerAt = now(); action();
  };
  const end = (event: Event) => {
    if (!primary(event)) return;
    const hadDown = down; down = false; pointerAt = now();
    if (!hadDown) action(); // Fallback for browsers delivering only a release.
  };
  const cancel = () => { down = false; pointerAt = now(); };
  const click = (event: Event) => {
    if (now() - pointerAt < 700) return;
    action();
  };
  target.addEventListener('pointerdown', start);
  target.addEventListener('pointerup', end);
  target.addEventListener('pointercancel', cancel);
  target.addEventListener('click', click);
  return () => {
    target.removeEventListener('pointerdown', start); target.removeEventListener('pointerup', end);
    target.removeEventListener('pointercancel', cancel); target.removeEventListener('click', click);
  };
}
