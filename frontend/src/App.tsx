import { AuthProvider, useAuth } from './lib/auth-context';
import { AuthController } from './features/auth/components/AuthForms';
import ManagerDashboard from './pages/ManagerDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AnalysisDetail from './pages/AnalysisDetail';
import CumulativeAnalysis from './pages/CumulativeAnalysis';
import { Toaster } from 'sonner';
import { LogOut, LayoutDashboard, Settings, User, Bell, Search } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/**
 * RoleBasedDashboard: Kullanıcının rolüne göre ana sayfasını belirler.
 */
function RoleBasedDashboard() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'MANAGER': return <ManagerDashboard />;
    case 'TEACHER': return <TeacherDashboard />;
    case 'STUDENT': return <StudentDashboard />;
    default: return <Navigate to="/" />;
  }
}

/**
 * AppContent: Uygulamanın ana içerik ve navigasyon yönetim merkezidir.
 */
function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-6 bg-[#F8FAFC]">
      <div className="w-12 h-12 border-[6px] border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Sistem Yükleniyor</p>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="auth-gradient min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
        <div className="w-full flex flex-col items-center gap-12 z-10">
          <div className="text-center animate-in fade-in slide-in-from-top-10 duration-1000">
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 flex items-center justify-center gap-3">
              <span>ANALİZ</span>
              <span className="text-cyan-500 italic">SİSTEMİ</span>
            </h1>
          </div>
          <AuthController />
          <p className="text-slate-300 text-[10px] font-black tracking-[0.4em] uppercase">Analysis Platform &bull; Core System</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <nav className="h-24 bg-white/70 backdrop-blur-3xl border-b border-slate-100 flex items-center justify-between px-12 sticky top-0 z-50">
        <div className="flex items-center gap-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl italic">A</div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
                ANALİZ <span className="text-cyan-500 italic">SİSTEMİ</span>
             </h1>
          </div>
          <div className="hidden lg:flex items-center gap-10">
            {[
                { label: 'Dashboard', icon: LayoutDashboard, active: true },
                { label: 'Raporlar', icon: Search, active: false },
                { label: 'Bildirimler', icon: Bell, active: false },
                { label: 'Ayarlar', icon: Settings, active: false }
            ].map((item) => (
                <button key={item.label} className={`flex items-center gap-2.5 font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:text-cyan-600 ${item.active ? 'text-cyan-600 border-b-2 border-cyan-500 pb-2' : 'text-slate-400 pb-2'}`}>
                  <item.icon className="h-4 w-4" /> {item.label}
                </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-sm font-black text-slate-800 tracking-tight">{user?.fullName}</span>
            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1 rounded-lg mt-1">{user?.role}</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-slate-100 border-2 border-white shadow-xl flex items-center justify-center text-slate-500 group cursor-pointer hover:scale-110 transition-transform">
             <User className="h-6 w-6 group-hover:text-cyan-600 transition-colors" />
          </div>
          <button onClick={logout} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90">
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </nav>

      <main className="flex-1 container mx-auto py-16 px-12">
        <Routes>
          <Route path="/" element={<RoleBasedDashboard />} />
          <Route path="/analysis/:reportId" element={<AnalysisDetail />} />
          <Route path="/analysis/cumulative/:studentId" element={<CumulativeAnalysis />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" richColors theme="light" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
