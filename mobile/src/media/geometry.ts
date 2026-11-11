export function containedImage(viewWidth: number, viewHeight: number, imageWidth: number, imageHeight: number) {
  if ([viewWidth, viewHeight, imageWidth, imageHeight].some(n => !Number.isFinite(n) || n <= 0)) return { x: 0, y: 0, width: 0, height: 0 };
  const scale = Math.min(viewWidth / imageWidth, viewHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { x: (viewWidth - width) / 2, y: (viewHeight - height) / 2, width, height };
}
export function pointInImage(x: number, y: number, frame: ReturnType<typeof containedImage>) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !frame.width || !frame.height || x < frame.x || y < frame.y || x >= frame.x + frame.width || y >= frame.y + frame.height) return null;
  return { x: (x - frame.x) / frame.width, y: (y - frame.y) / frame.height };
}
export function selectionBox(center: { x: number; y: number }, width: number, height: number): [number, number, number, number] {
  const x = Math.max(.25, Math.min(.75, center.x));
  const y = Math.max(.3, Math.min(.7, center.y));
  return [Math.floor((x - .25) * width), Math.floor((y - .3) * height), Math.ceil((x + .25) * width), Math.ceil((y + .3) * height)];
}
