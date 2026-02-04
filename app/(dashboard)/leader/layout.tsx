import AppShellGate from "../../../components/layouts/AppShellGate";

export default function LeaderLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <AppShellGate>{children}</AppShellGate>;
}
