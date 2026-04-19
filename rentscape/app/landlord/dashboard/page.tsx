// app/(landlord)/dashboard/page.tsx
export default function LandlordDashboard() {
  return (
    <div className="p-8">
      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(24px)', borderRadius: '24px' }}
        className="p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-4">Landlord Dashboard</h1>
        <p className="text-slate-300">Welcome to your landlord dashboard.</p>
      </div>
    </div>
  );
}
