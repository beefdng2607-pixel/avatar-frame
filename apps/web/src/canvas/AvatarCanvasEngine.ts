import { CANVAS_SIZE, type RenderCanvasOptions, type TransformState } from './types.js';

export function getCoverTransform(
  imageWidth: number,
  imageHeight: number,
): TransformState {
  const scaleX = CANVAS_SIZE / imageWidth;
  const scaleY = CANVAS_SIZE / imageHeight;
  const baseScale = Math.max(scaleX, scaleY); // Fill / cover canvas

  return {
    x: 0,
    y: 0,
    scale: 1.0,
    baseScale: baseScale > 0 ? baseScale : 1.0,
    rotation: 0,
  };
}

export function getContainTransform(
  imageWidth: number,
  imageHeight: number,
): TransformState {
  const scaleX = CANVAS_SIZE / imageWidth;
  const scaleY = CANVAS_SIZE / imageHeight;
  const baseScale = Math.min(scaleX, scaleY); // Fit whole image inside canvas

  return {
    x: 0,
    y: 0,
    scale: 1.0,
    baseScale: baseScale > 0 ? baseScale : 1.0,
    rotation: 0,
  };
}

export function getDefaultTransform(
  imageWidth: number,
  imageHeight: number,
): TransformState {
  return getCoverTransform(imageWidth, imageHeight);
}

export function renderAvatarCanvas({
  canvas,
  userImage,
  frameImage,
  transform,
  cropCircle = false,
}: RenderCanvasOptions): void {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // Enforce internal rendering resolution at exactly 1080x1080
  if (canvas.width !== CANVAS_SIZE) canvas.width = CANVAS_SIZE;
  if (canvas.height !== CANVAS_SIZE) canvas.height = CANVAS_SIZE;

  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Apply Circular Clip Mask if requested (for 100% Zalo Avatar circle fit)
  if (cropCircle) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  // ─── Layer 1: User Image ───────────────────────────────────────────────────
  ctx.save();

  // Move origin to center of 1080x1080 canvas
  const centerX = CANVAS_SIZE / 2;
  const centerY = CANVAS_SIZE / 2;
  ctx.translate(centerX + transform.x, centerY + transform.y);

  // Rotate around center
  const rad = (transform.rotation * Math.PI) / 180;
  ctx.rotate(rad);

  // Apply effective scale = baseScale (for 1080p fit) * relative scale multiplier
  const effectiveScale = (transform.baseScale || 1.0) * transform.scale;
  ctx.scale(effectiveScale, effectiveScale);

  // Draw user image centered at origin
  const imgW = userImage.naturalWidth || userImage.width;
  const imgH = userImage.naturalHeight || userImage.height;
  ctx.drawImage(userImage, -imgW / 2, -imgH / 2, imgW, imgH);

  ctx.restore();

  // ─── Layer 2: Campaign Frame PNG ───────────────────────────────────────────
  if (frameImage && frameImage.complete && frameImage.naturalWidth > 0) {
    ctx.drawImage(frameImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  // Restore clip state if applied
  if (cropCircle) {
    ctx.restore();
  }
}

/**
 * Export canvas to 1080x1080 PNG Blob
 */
export function exportCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate PNG blob from canvas'));
      }
    }, 'image/png');
  });
}
