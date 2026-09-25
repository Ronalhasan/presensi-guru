import AdminNav from '@/components/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#120e19] text-white">
      <AdminNav />
      <div className="mx-auto max-w-4xl px-5 py-6">{children}</div>
    </div>
  );
}
