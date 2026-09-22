export default function ZaloGuideCard() {
  return (
    <div className="w-full max-w-md mx-auto card bg-surface-card/70 border-surface-border p-5 text-left space-y-3">
      <div className="flex items-center gap-2 text-brand-300 font-semibold text-sm">
        <span className="text-base">💡</span>
        <span>How to set your new Zalo Avatar</span>
      </div>

      <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
        <p className="text-slate-400">
          Zalo requires users to update profile photos manually inside the app for security:
        </p>

        <ol className="list-decimal list-inside space-y-1 text-slate-200">
          <li>
            Tap <strong className="text-slate-100 font-semibold">Download Avatar</strong> to save the 1080×1080 PNG to your device.
          </li>
          <li>
            Open the <strong className="text-blue-400 font-semibold">Zalo app</strong> on your phone.
          </li>
          <li>
            Go to <strong className="text-slate-100 font-semibold">Me → Profile → Change Profile Picture</strong> and select your downloaded image.
          </li>
        </ol>
      </div>
    </div>
  );
}
