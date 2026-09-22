import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PublicCampaign } from '@avatar-frame/shared';
import { getPublicCampaignApi, trackAnalyticsApi } from '@/services/api';
import {
  getDefaultTransform,
  getCoverTransform,
  getContainTransform,
  exportCanvasBlob,
  renderAvatarCanvas,
} from '@/canvas/AvatarCanvasEngine';
import type { TransformState } from '@/canvas/types';
import AvatarEditorCanvas from '@/components/user/AvatarEditorCanvas';
import EditorControls from '@/components/user/EditorControls';
import ZaloGuideCard from '@/components/user/ZaloGuideCard';

type UserStep = 'upload' | 'editor' | 'preview';

export default function CampaignPage() {
  const { slug } = useParams<{ slug: string }>();

  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User image state
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<TransformState>({ x: 0, y: 0, scale: 1, baseScale: 1, rotation: 0 });
  const [exportShape, setExportShape] = useState<'circle' | 'square'>('circle');

  // Flow step state
  const [step, setStep] = useState<UserStep>('upload');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>(
    `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  );

  // Load campaign & pre-load campaign frame image
  useEffect(() => {
    if (!slug) return;

    const loadCampaign = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicCampaignApi(slug);
        setCampaign(data);

        // Preload frame PNG
        if (data.frameUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = data.frameUrl;
          img.onload = () => setFrameImage(img);
          img.onerror = () => {
            const fallbackImg = new Image();
            fallbackImg.src = data.frameUrl;
            fallbackImg.onload = () => setFrameImage(fallbackImg);
          };
        }

        // Ingest analytics: campaign_view
        void trackAnalyticsApi({
          event: 'campaign_view',
          campaignId: data.id,
          sessionId: sessionIdRef.current,
          timestamp: Date.now(),
        });
      } catch (err: unknown) {
        setError((err as Error).message || 'Campaign unavailable');
      } finally {
        setLoading(false);
      }
    };

    void loadCampaign();
  }, [slug]);

  // Handle user photo file selection
  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid image format. Please select a JPG, PNG, or WEBP photo.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size too large. Maximum photo size is 10 MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setUserImage(img);
          const initialTransform = getDefaultTransform(img.naturalWidth, img.naturalHeight);
          setTransform(initialTransform);
          setStep('editor');
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Generate 1080x1080 PNG result
  const handleGenerate = async () => {
    if (!userImage || !campaign) return;

    try {
      // Create offscreen canvas at exact 1080x1080 resolution
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = 1080;
      offscreenCanvas.height = 1080;

      renderAvatarCanvas({
        canvas: offscreenCanvas,
        userImage,
        frameImage,
        transform,
        cropCircle: exportShape === 'circle',
      });

      const blob = await exportCanvasBlob(offscreenCanvas);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStep('preview');

      // Track analytics event: image_render
      void trackAnalyticsApi({
        event: 'image_render',
        campaignId: campaign.id,
        sessionId: sessionIdRef.current,
        timestamp: Date.now(),
      });
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to generate avatar');
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || !campaign) return;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `avatar_${campaign.slug}_${Date.now()}.png`;
    a.click();

    // Track analytics event: image_download
    void trackAnalyticsApi({
      event: 'image_download',
      campaignId: campaign.id,
      sessionId: sessionIdRef.current,
      timestamp: Date.now(),
    });
  };

  const handleResetTransform = () => {
    if (userImage) {
      setTransform(getDefaultTransform(userImage.naturalWidth, userImage.naturalHeight));
    }
  };

  const handleFitCover = () => {
    if (userImage) {
      setTransform(getCoverTransform(userImage.naturalWidth, userImage.naturalHeight));
    }
  };

  const handleFitContain = () => {
    if (userImage) {
      setTransform(getContainTransform(userImage.naturalWidth, userImage.naturalHeight));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-4 bg-surface">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading campaign...</p>
      </div>
    );
  }

  // Error / Expired / Disabled Gating State
  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-4 bg-surface text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-2xl shadow-glow">
          ⚠️
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-display font-bold text-slate-100">
            Chiến dịch hiện không khả dụng
          </h1>
          <p className="text-slate-300 text-sm font-medium">
            {error || 'Chiến dịch không tồn tại, chưa được kích hoạt hoặc đã hết hạn.'}
          </p>
          <p className="text-xs text-slate-400 pt-1">
            (Nếu bạn là Quản trị viên: Vui lòng kiểm tra Bảng quản trị Admin và đảm bảo Trạng thái của chiến dịch đang ở mức <strong className="text-emerald-400 font-semibold">Active</strong>)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin" className="btn-primary text-xs sm:text-sm py-2 px-4">
            Trang Quản trị Admin
          </Link>
          <Link to="/" className="btn-secondary text-xs sm:text-sm py-2 px-4">
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface text-slate-100 flex flex-col justify-between py-6 px-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <header className="w-full max-w-md mx-auto text-center mb-6 relative z-10">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-2">
          Avatar Campaign
        </span>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-100 tracking-tight">
          {campaign.name}
        </h1>
        {campaign.description && (
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
            {campaign.description}
          </p>
        )}
      </header>

      {/* Main Flow Content */}
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center relative z-10 space-y-6">
        {/* Step 1: Upload Photo Dropzone */}
        {step === 'upload' && (
          <div className="space-y-6 animate-fade-in">
            {/* Frame Thumbnail Preview */}
            {campaign.frameUrl && (
              <div className="flex flex-col items-center justify-center mb-2">
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border border-surface-border bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-900 shadow-xl p-3 flex items-center justify-center">
                  <img
                    src={campaign.frameUrl}
                    alt={campaign.name}
                    className="w-full h-full object-contain filter drop-shadow-md"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">Khung chiến dịch mẫu</p>
              </div>
            )}

            {/* Dropzone Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              className="card bg-surface-card/90 border-2 border-dashed border-surface-border hover:border-brand-500 cursor-pointer p-8 text-center transition-all duration-200 group shadow-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 text-brand-400 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-lg font-display font-bold text-slate-100 mb-1">
                Upload Your Photo
              </h2>
              <p className="text-slate-400 text-xs mb-4">
                Drag & drop your image here, or tap to browse files
              </p>
              <span className="btn-primary text-sm py-2.5 px-6 inline-flex">
                Select Photo
              </span>
              <p className="text-[11px] text-slate-500 mt-4">
                Supports JPG, PNG, WEBP • Max 10 MB
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Interactive Editor */}
        {step === 'editor' && userImage && (
          <div className="space-y-6 animate-fade-in">
            <AvatarEditorCanvas
              userImage={userImage}
              frameImage={frameImage}
              transform={transform}
              onChangeTransform={setTransform}
              exportShape={exportShape}
              onChangeExportShape={setExportShape}
            />

            <EditorControls
              transform={transform}
              onChangeTransform={setTransform}
              onReset={handleResetTransform}
              onFitCover={handleFitCover}
              onFitContain={handleFitContain}
              onChangePhoto={() => setStep('upload')}
              onGenerate={handleGenerate}
            />
          </div>
        )}

        {/* Step 3: Result Preview & Download */}
        {step === 'preview' && downloadUrl && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="relative w-full aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden border-2 border-brand-500 shadow-glow-lg bg-slate-900">
              <img
                src={downloadUrl}
                alt="Final generated avatar"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownload}
                className="btn-primary w-full py-4 text-lg shadow-glow hover:shadow-glow-lg flex items-center justify-center gap-2"
              >
                <span>📥</span>
                <span>Download Avatar (1080×1080)</span>
              </button>

              <button
                onClick={() => setStep('editor')}
                className="btn-secondary w-full py-3 text-sm"
              >
                ✏️ Re-adjust Photo
              </button>
            </div>

            <ZaloGuideCard />
          </div>
        )}
      </main>

      {/* Footer Privacy Guarantee Note */}
      <footer className="w-full max-w-md mx-auto text-center mt-6 pt-4 border-t border-surface-border/50 text-[11px] text-slate-400 relative z-10">
        🔒 <strong className="text-slate-300 font-semibold">100% Private</strong> — All photo processing happens locally on your device. Your photos are never uploaded or stored on servers.
      </footer>
    </div>
  );
}
