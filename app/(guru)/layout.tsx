import BottomNav from '@/components/BottomNav';

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#120e19] text-white">
      <div className="mx-auto max-w-md pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
