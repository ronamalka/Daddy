import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WeakPasswordBanner } from "@/components/weak-password-banner";
import { EmailVerifyBanner } from "@/components/email-verify-banner";
import { NewMessageToast } from "@/components/inbox/new-message-toast";

/** Adds the navbar, footer, and main content area around each page. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <WeakPasswordBanner />
      <EmailVerifyBanner />
      <main id="main-content" className="flex-1" role="main">{children}</main>
      <NewMessageToast />
      <Footer />
    </>
  );
}
