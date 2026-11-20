/**
 * Photos stay on the device: they're decoded in the browser, downscaled to a
 * canvas for fast per-frame drawing, and never uploaded anywhere.
 */
export type LoadedPhoto = {
  /** Downscaled bitmap the renderer draws from. */
  canvas: HTMLCanvasElement;
  /** Small JPEG data URL for form thumbnails. */
  thumbUrl: string;
};

const MAX_EDGE = 1280;
const THUMB_EDGE = 320;

export async function loadPhoto(file: File): Promise<LoadedPhoto> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const url = URL.createObjectURL(file);
  try {
    const img = await decode(url);
    const canvas = scaleTo(img, MAX_EDGE);
    const thumb = scaleTo(canvas, THUMB_EDGE);
    return { canvas, thumbUrl: thumb.toDataURL("image/jpeg", 0.85) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function decode(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image couldn't be opened. Try a JPG or PNG."));
    img.src = url;
  });
}

function scaleTo(src: HTMLImageElement | HTMLCanvasElement, maxEdge: number): HTMLCanvasElement {
  const sw = src instanceof HTMLImageElement ? src.naturalWidth : src.width;
  const sh = src instanceof HTMLImageElement ? src.naturalHeight : src.height;
  const k = Math.min(1, maxEdge / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * k));
  canvas.height = Math.max(1, Math.round(sh * k));
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}
