import { useState, useRef, type ChangeEvent } from 'react';
import type { Campaign } from '@avatar-frame/shared';
import { uploadFrameApi, deleteFrameApi } from '@/services/api';

interface FrameUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onSuccess: () => void;
}

export default function FrameUploaderModal({
  isOpen,
  onClose,
  campaign,
  onSuccess,
}: FrameUploaderModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
    isResized?: boolean;
    originalWidth?: number;
    originalHeight?: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !campaign) return null;

  const currentFrameUrl = campaign.frameUrl;

  const validateAndSetFile = (file: File) => {
    setError(null);

    if (file.type !== 'image/png') {
      setError('Invalid format: File must be a PNG image');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large: Maximum frame size is 10 MB');
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const origW = img.width;
      const origH = img.height;

      if (origW === 1080 && origH === 1080) {
        setDimensions({ width: 1080, height: 1080, isResized: false, originalWidth: 1080, originalHeight: 1080 });
        setSelectedFile(file);
        setPreviewUrl(objectUrl);
      } else {
        // Auto-scale PNG frame of any resolution to 1080x1080 preserving transparency
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setError('Failed to process image on canvas');
          return;
        }

        ctx.clearRect(0, 0, 1080, 1080);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, 1080, 1080);

        canvas.toBlob((blob) => {
          if (!blob) {
            setError('Failed to normalize PNG image to 1080x1080');
            return;
          }

          const resizedFile = new File([blob], file.name || 'frame-1080x1080.png', {
            type: 'image/png',
            lastModified: Date.now(),
          });

          const resizedUrl = URL.createObjectURL(resizedFile);
          setDimensions({
            width: 1080,
            height: 1080,
            isResized: true,
            originalWidth: origW,
            originalHeight: origH,
          });
          setSelectedFile(resizedFile);
          setPreviewUrl(resizedUrl);
        }, 'image/png');
      }
    };

    img.onerror = () => {
      setError('Failed to load image file for validation');
      setSelectedFile(null);
      setPreviewUrl(null);
    };

    img.src = objectUrl;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      await uploadFrameApi(campaign.id, selectedFile);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to upload frame');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFrame = async () => {
    if (!confirm('Are you sure you want to remove the current campaign frame?')) return;
    setLoading(true);
    setError(null);

    try {
      await deleteFrameApi(campaign.id);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to delete frame');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-lg w-full bg-surface-card border-surface-border shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
          <div>
            <h2 className="text-xl font-display font-bold text-slate-100">
              Campaign Frame Upload
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{campaign.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Frame Spec Requirement Box */}
        <div className="mb-4 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 space-y-1">
          <p className="font-semibold text-brand-200">Requirements:</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-300">
            <li>PNG format with RGBA transparent background</li>
            <li>Auto-normalized to <strong className="text-brand-300">1080 × 1080 pixels</strong> (all image sizes accepted)</li>
            <li>Maximum file size: 15 MB</li>
          </ul>
        </div>

        {/* Frame Preview Canvas Box */}
        <div className="flex justify-center mb-6">
          <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-dashed border-surface-border bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-900 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-brand-500 transition-all">
            {previewUrl || currentFrameUrl ? (
              <img
                src={previewUrl || currentFrameUrl!}
                alt="Frame preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 flex flex-col items-center justify-center"
              >
                <svg className="w-10 h-10 text-slate-500 group-hover:text-brand-400 transition-colors mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-semibold text-slate-200">Click to select PNG</p>
                <p className="text-xs text-slate-500 mt-1">Supports any PNG size</p>
              </div>
            )}
          </div>
        </div>

        {dimensions && (
          <p className="text-center text-xs text-slate-400 mb-4">
            Validated: <span className="font-mono text-emerald-400">1080×1080 px</span>
            {dimensions.isResized && (
              <span className="text-brand-300 ml-1.5">
                (Auto-resized from {dimensions.originalWidth}×{dimensions.originalHeight} px)
              </span>
            )}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-surface-border">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs sm:text-sm py-2.5 flex-1"
          >
            Select PNG File
          </button>

          {selectedFile && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="btn-primary text-xs sm:text-sm py-2.5 flex-1"
            >
              {loading ? 'Uploading...' : 'Save Frame'}
            </button>
          )}

          {!selectedFile && currentFrameUrl && (
            <button
              type="button"
              onClick={handleDeleteFrame}
              disabled={loading}
              className="btn-danger text-xs sm:text-sm py-2.5"
            >
              Remove Frame
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
