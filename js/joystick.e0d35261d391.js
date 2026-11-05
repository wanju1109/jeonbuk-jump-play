// Circular dead zone and a hard outer radius; movement speed matches keyboard input.
export function stickVector(dx, dy, radius) {
  const length = Math.hypot(dx, dy), dead = radius * .12;
  if (length <= dead) return { x: 0, y: 0, knobX: dx, knobY: dy };
  const reach = Math.min(length, radius), speed = 1;
  return { x: dx / length * speed, y: dy / length * speed,
    knobX: dx / length * reach, knobY: dy / length * reach };
}

export function installStick(zone, base, { enabled, onMove, onStart }) {
  let pointer = null, originX = 0, originY = 0, radius = 48;
  const knob = base.querySelector('.stick-knob');
  function reset() {
    const old = pointer; pointer = null;
    onMove(0, 0); knob.style.transform = 'translate(0px, 0px)';
    base.classList.remove('active'); base.style.left = ''; base.style.top = '';
    if (old !== null && zone.hasPointerCapture(old)) zone.releasePointerCapture(old);
  }
  function move(event) {
    if (event.pointerId !== pointer) return;
    event.preventDefault();
    const v = stickVector(event.clientX - originX, event.clientY - originY, radius);
    onMove(v.x, v.y); knob.style.transform = `translate(${v.knobX}px, ${v.knobY}px)`;
  }
  zone.addEventListener('pointerdown', event => {
    if (!enabled() || pointer !== null) return;
    event.preventDefault(); pointer = event.pointerId;
    const box = zone.getBoundingClientRect(), size = base.getBoundingClientRect().width;
    const inset = size / 2 + 3;
    const x = Math.max(inset, Math.min(box.width - inset, event.clientX - box.left));
    const y = Math.max(inset, Math.min(box.height - inset, event.clientY - box.top));
    originX = box.left + x; originY = box.top + y; radius = size * .36;
    base.style.left = `${x}px`; base.style.top = `${y}px`;
    base.classList.add('active'); zone.setPointerCapture(pointer); onStart(); move(event);
  });
  zone.addEventListener('pointermove', move);
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    zone.addEventListener(event, e => { if (e.pointerId === pointer) reset(); });
  }
  zone.addEventListener('contextmenu', e => e.preventDefault());
  return { reset };
}
