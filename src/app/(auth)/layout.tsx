export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#FAFBFF]">
      {/* Right side - gradient branding panel (RTL: appears on right) */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-12"
        style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #00D2D3 100%)" }}
      >
        <div className="max-w-md text-center">
          <h1 className="text-5xl font-extrabold tracking-[-0.02em] text-white mb-4">
            אבאל׳ה
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            השוק שבו כישרון פוגש הזדמנות. מצא את הפרילנסר המושלם או הציג את הכישורים שלך לעולם.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <div className="rounded-[16px] bg-white/15 backdrop-blur-sm px-6 py-4 text-center">
              <p className="text-2xl font-bold text-white">10k+</p>
              <p className="text-sm text-white/70">פרילנסרים</p>
            </div>
            <div className="rounded-[16px] bg-white/15 backdrop-blur-sm px-6 py-4 text-center">
              <p className="text-2xl font-bold text-white">50k+</p>
              <p className="text-sm text-white/70">פרויקטים</p>
            </div>
            <div className="rounded-[16px] bg-white/15 backdrop-blur-sm px-6 py-4 text-center">
              <p className="text-2xl font-bold text-white">99%</p>
              <p className="text-sm text-white/70">שביעות רצון</p>
            </div>
          </div>
        </div>
      </div>

      {/* Left side - form area */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}
