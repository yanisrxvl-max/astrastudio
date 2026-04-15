export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.08),transparent)]" />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
