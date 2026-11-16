// A pointer release and its synthetic click represent one press.
export function bindPress(target: EventTarget, action: () => void, now = () => performance.now()) {
  let pointerAt = -Infinity;
  const pointer = (event: Event) => {
    const input = event as PointerEvent;
    if (input.isPrimary === false || (input.button !== undefined && input.button !== 0)) return;
    pointerAt = now(); action();
  };
  const click = (event: Event) => {
    if (now() - pointerAt < 700) return;
    action();
  };
  target.addEventListener('pointerup', pointer);
  target.addEventListener('click', click);
  return () => { target.removeEventListener('pointerup', pointer); target.removeEventListener('click', click); };
}
