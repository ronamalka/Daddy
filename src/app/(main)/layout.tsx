import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1" role="main">{children}</main>
      <Footer />
    </>
  );
}
