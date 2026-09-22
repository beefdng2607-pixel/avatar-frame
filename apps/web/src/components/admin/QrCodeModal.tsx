import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { Campaign } from '@avatar-frame/shared';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
}

export default function QrCodeModal({ isOpen, onClose, campaign }: QrCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const campaignUrl = campaign ? `${window.location.origin}/c/${campaign.slug}` : '';

  useEffect(() => {
    if (isOpen && campaignUrl && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, campaignUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
    }
  }, [isOpen, campaignUrl]);

  if (!isOpen || !campaign) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDownloadQr = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode_${campaign.slug}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-sm w-full bg-surface-card border-surface-border shadow-2xl p-6 text-center">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
          <h2 className="text-lg font-display font-bold text-slate-100">Campaign QR Code</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm font-semibold text-slate-200 mb-1">{campaign.name}</p>
        <p className="text-xs font-mono text-brand-400 truncate mb-4">{campaignUrl}</p>

        {/* QR Canvas Box */}
        <div className="flex justify-center p-4 bg-white rounded-2xl shadow-inner mb-6 inline-block mx-auto">
          <canvas ref={canvasRef} className="w-48 h-48" />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopyUrl}
            className="btn-secondary flex-1 py-2.5 text-xs sm:text-sm"
          >
            {copied ? '✅ Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleDownloadQr}
            className="btn-primary flex-1 py-2.5 text-xs sm:text-sm"
          >
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
