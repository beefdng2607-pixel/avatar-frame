import { useRef, useEffect, useState } from 'react';
import type { TransformState } from '@/canvas/types';
import { renderAvatarCanvas } from '@/canvas/AvatarCanvasEngine';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';

interface AvatarEditorCanvasProps {
  userImage: HTMLImageElement;
  frameImage?: HTMLImageElement | null;
  transform: TransformState;
  onChangeTransform: (newTransform: TransformState) => void;
  exportShape?: 'circle' | 'square';
  onChangeExportShape?: (shape: 'circle' | 'square') => void;
}

export default function AvatarEditorCanvas({
  userImage,
  frameImage,
  transform,
  onChangeTransform,
  exportShape = 'circle',
  onChangeExportShape,
}: AvatarEditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isInteracting } = useCanvasInteraction({
    containerRef,
    transform,
    onChange: onChangeTransform,
  });

  // Re-render canvas whenever transform, images or shape change
  useEffect(() => {
    if (canvasRef.current && userImage) {
      renderAvatarCanvas({
        canvas: canvasRef.current,
        userImage,
        frameImage,
        transform,
        cropCircle: exportShape === 'circle',
      });
    }
  }, [userImage, frameImage, transform, exportShape]);

  return (
    <div className="flex flex-col items-center select-none w-full max-w-md mx-auto">
      {/* Export Shape Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full mb-3 px-1 gap-2">
        <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
          <span>✨</span> Kích thước & Hình dạng Avatar:
        </span>
        {onChangeExportShape && (
          <div className="flex bg-slate-900/90 p-1 rounded-full border border-surface-border shadow-inner">
            <button
              type="button"
              onClick={() => onChangeExportShape('circle')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                exportShape === 'circle'
                  ? 'bg-brand-500 text-white shadow-glow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔵</span> Tròn Khít Zalo
            </button>
            <button
              type="button"
              onClick={() => onChangeExportShape('square')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                exportShape === 'square'
                  ? 'bg-brand-500 text-white shadow-glow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⏹️</span> Vuông Standard
            </button>
          </div>
        )}
      </div>

      {/* Canvas Container with 1:1 aspect ratio */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border-2 transition-all duration-150 touch-none cursor-grab active:cursor-grabbing bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 ${
          isInteracting
            ? 'border-brand-400 shadow-glow-lg scale-[1.01]'
            : 'border-surface-border shadow-2xl'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={1080}
          height={1080}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Zalo Circular Guide Ring overlay when circular mode is active */}
        {exportShape === 'circle' && (
          <div className="absolute inset-0 rounded-full border border-blue-400/40 pointer-events-none" />
        )}

        {/* Floating Touch / Drag Hint Banner */}
        <div
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-slate-300 pointer-events-none transition-opacity duration-200 flex items-center gap-1.5 ${
            isInteracting ? 'opacity-30' : 'opacity-90'
          }`}
        >
          <span>👉 Kéo di chuyển</span>
          <span className="text-slate-500">•</span>
          <span>🤏 Phóng to / thu nhỏ</span>
        </div>
      </div>
    </div>
  );
}
