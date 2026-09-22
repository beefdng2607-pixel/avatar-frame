import type { TransformState } from '@/canvas/types';

interface EditorControlsProps {
  transform: TransformState;
  onChangeTransform: (newTransform: TransformState) => void;
  onReset: () => void;
  onFitCover?: () => void;
  onFitContain?: () => void;
  onChangePhoto: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export default function EditorControls({
  transform,
  onChangeTransform,
  onReset,
  onFitCover,
  onFitContain,
  onChangePhoto,
  onGenerate,
  isGenerating = false,
}: EditorControlsProps) {
  const handleZoomChange = (newScale: number) => {
    onChangeTransform({
      ...transform,
      scale: Math.max(0.2, Math.min(4.0, newScale)),
    });
  };

  const handleRotateChange = (deg: number) => {
    onChangeTransform({
      ...transform,
      rotation: (deg + 360) % 360,
    });
  };

  const rotate90 = () => {
    handleRotateChange(transform.rotation + 90);
  };

  return (
    <div className="w-full max-w-md mx-auto card bg-surface-card/90 border-surface-border p-5 space-y-5 animate-slide-up">
      {/* Zoom Control */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <span>🔍</span>
            <span>Zoom</span>
          </span>
          <span className="font-mono text-brand-400 font-bold">
            {Math.round(transform.scale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleZoomChange(transform.scale - 0.1)}
            className="w-8 h-8 rounded-lg bg-surface border border-surface-border text-slate-300 hover:bg-slate-700 active:scale-95 transition-all font-bold flex items-center justify-center shrink-0 select-none"
            title="Zoom out"
          >
            -
          </button>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.05"
            value={transform.scale}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
          <button
            type="button"
            onClick={() => handleZoomChange(transform.scale + 0.1)}
            className="w-8 h-8 rounded-lg bg-surface border border-surface-border text-slate-300 hover:bg-slate-700 active:scale-95 transition-all font-bold flex items-center justify-center shrink-0 select-none"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      {/* Rotation Control */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <span>🔄</span>
            <span>Rotation</span>
          </span>
          <span className="font-mono text-brand-400 font-bold">
            {Math.round(transform.rotation)}°
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={transform.rotation}
            onChange={(e) => handleRotateChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
          <button
            type="button"
            onClick={rotate90}
            className="px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-xs font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition-all shrink-0 select-none"
            title="Rotate 90 degrees"
          >
            +90°
          </button>
        </div>
      </div>

      {/* Fit Presets */}
      {(onFitCover || onFitContain) && (
        <div className="flex gap-2">
          {onFitCover && (
            <button
              type="button"
              onClick={onFitCover}
              className="btn-secondary btn-sm flex-1 text-xs py-1.5 font-medium flex items-center justify-center gap-1"
              title="Phủ kín toàn bộ khung 1080x1080"
            >
              <span>🖼️</span> Fit Lấp Đầy (Cover)
            </button>
          )}
          {onFitContain && (
            <button
              type="button"
              onClick={onFitContain}
              className="btn-secondary btn-sm flex-1 text-xs py-1.5 font-medium flex items-center justify-center gap-1"
              title="Vừa khít toàn bộ ảnh trong khung"
            >
              <span>📐</span> Fit Vừa Khít (Contain)
            </button>
          )}
        </div>
      )}

      {/* Auxiliary Action Buttons */}
      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary btn-sm flex-1 text-xs py-2"
        >
          ↺ Reset
        </button>
        <button
          type="button"
          onClick={onChangePhoto}
          className="btn-secondary btn-sm flex-1 text-xs py-2"
        >
          📷 Change Photo
        </button>
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="btn-primary w-full py-3.5 text-base shadow-glow hover:shadow-glow-lg"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Avatar...
          </>
        ) : (
          '✨ Generate Avatar'
        )}
      </button>
    </div>
  );
}
