/**
 * Precise coordinate mapper for Canvas interaction
 * Handles both standard orientation and 90-degree clockwise rotated landscape mode.
 */
export function getCanvasEventCoords(
  canvas: HTMLCanvasElement | null,
  clientX: number,
  clientY: number,
  isRotated90 = false,
  baseWidth = 680,
  baseHeight = 430
): { x: number; y: number } {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();

  let rawX = 0;
  let rawY = 0;

  if (isRotated90) {
    // 90 degrees clockwise rotation:
    // Viewport downwards (+Y) maps to local canvas (+X)
    // Viewport leftwards (-X from right) maps to local canvas (+Y)
    const scaleX = baseWidth / Math.max(1, rect.height);
    const scaleY = baseHeight / Math.max(1, rect.width);
    rawX = (clientY - rect.top) * scaleX;
    rawY = (rect.right - clientX) * scaleY;
  } else {
    const scaleX = baseWidth / Math.max(1, rect.width);
    const scaleY = baseHeight / Math.max(1, rect.height);
    rawX = (clientX - rect.left) * scaleX;
    rawY = (clientY - rect.top) * scaleY;
  }

  return {
    x: Math.max(0, Math.min(baseWidth, rawX)),
    y: Math.max(0, Math.min(baseHeight, rawY)),
  };
}
