export interface TransformState {
  /** Offset X relative to canvas center (pixels) */
  x: number;
  /** Offset Y relative to canvas center (pixels) */
  y: number;
  /** Relative scale factor (1.0 = 100% cover fit) */
  scale: number;
  /** Base scale required to fit image to 1080x1080 canvas */
  baseScale: number;
  /** Rotation angle in degrees (0..360) */
  rotation: number;
}

export const CANVAS_SIZE = 1080;

export interface RenderCanvasOptions {
  canvas: HTMLCanvasElement;
  userImage: HTMLImageElement;
  frameImage?: HTMLImageElement | null | undefined;
  transform: TransformState;
  cropCircle?: boolean;
}

export interface DefaultTransformOptions {
  imageWidth: number;
  imageHeight: number;
  canvasWidth?: number;
  canvasHeight?: number;
}
