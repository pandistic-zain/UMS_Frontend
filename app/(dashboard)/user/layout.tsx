import AppShellGate from "../../../components/layouts/AppShellGate";

export default function UserLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <AppShellGate>{children}</AppShellGate>;
}
