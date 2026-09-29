import { Footer } from "@/components/marketing/Footer";
import { Nav } from "@/components/marketing/Nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
