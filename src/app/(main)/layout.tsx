import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WeakPasswordBanner } from "@/components/weak-password-banner";
import { NewMessageToast } from "@/components/inbox/new-message-toast";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <WeakPasswordBanner />
      <main id="main-content" className="flex-1" role="main">{children}</main>
      <NewMessageToast />
      <Footer />
    </>
  );
}
