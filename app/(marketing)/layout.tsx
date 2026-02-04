import CTA from "../../components/marketing/sections/CTA";
import Footer from "../../components/marketing/sections/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CTA />
      <Footer />
    </>
  );
}
