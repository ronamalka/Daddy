import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#E8ECF1] bg-white py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <span className="text-gradient-hero text-xl font-extrabold">אבאל׳ה</span>
            <p className="text-[13px] text-[#B2BEC3] mt-1">שוק השירותים של ישראל</p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-[#2D3436]">פלטפורמה</span>
              <Link href="/" className="text-[13px] text-[#636E72] hover:text-[#6C5CE7] transition-colors">עיון</Link>
              <Link href="/how-it-works" className="text-[13px] text-[#636E72] hover:text-[#6C5CE7] transition-colors">איך זה עובד</Link>
              <Link href="/become-a-daddy" className="text-[13px] text-[#636E72] hover:text-[#6C5CE7] transition-colors">הפוך לאבאל׳ה</Link>
              <Link href="/about" className="text-[13px] text-[#636E72] hover:text-[#6C5CE7] transition-colors">אודות</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-[#2D3436]">חשבון</span>
              <Link href="/register" className="text-[13px] text-[#636E72] hover:text-[#6C5CE7] transition-colors">הרשמה</Link>
              <Link href="/login" className="text-[13px] text-[#636E72] hover:text-[#6C5CE7] transition-colors">התחברות</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-bold text-[#2D3436]">משפטי</span>
              <Link href="/terms" className="text-[13px] text-[#636E72] hover:text-[#6C5CE7] transition-colors">תנאי שימוש</Link>
              <Link href="/privacy" className="text-[13px] text-[#636E72] hover:text-[#6C5CE7] transition-colors">מדיניות פרטיות</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E8ECF1] pt-6 text-center">
          <p className="text-[12px] text-[#B2BEC3]">
            © 2024 אבאל׳ה. כל הזכויות שמורות (חוץ מזכות לנוח ביום שישי).
          </p>
        </div>
      </div>
    </footer>
  );
}
