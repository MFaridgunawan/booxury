// The root customize layout only wraps the standalone guide page.
// Wizard steps are under /customize/(wizard)/ and use their own layout.
export default function CustomizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
