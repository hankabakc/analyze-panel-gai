import { useState, useEffect } from "react";
import { membershipApi } from "@/lib/api";
import type { User } from "@/lib/types";
import { toast } from "sonner";
import { 
  XCircle, ShieldAlert, Clock, LayoutDashboard, Link2, 
  ChevronRight, Search, UserCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * ManagerDashboard: SaaS tarzı, sol navigasyonlu yönetim paneli.
 */
export default function ManagerDashboard() {
  // activeTab: Sol menüdeki aktif sekmeyi takip eder.
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "PENDING" | "PAIRING">("OVERVIEW");
  
  // State Yönetimi
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activeTeachers, setActiveTeachers] = useState<User[]>([]);
  const [activeStudents, setActiveStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Eşleştirme Seçimleri
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  /**
   * loadData: Tüm gerekli yönetim verilerini backend'den çeker.
   */
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pendingRes, teachersRes, studentsRes] = await Promise.all([
        membershipApi.getPendingUsers(),
        membershipApi.getTeachers(),
        membershipApi.getStudents()
      ]);
      
      setPendingUsers(pendingRes.data.data);
      setActiveTeachers(teachersRes.data.data);
      setActiveStudents(studentsRes.data.data);
    } catch (error) {
      toast.error("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * handleApprove: Kullanıcıyı onaylar ve listeleri (Bekleyen/Aktif) tazeler.
   */
  const handleApprove = async (userId: string) => {
    try {
      const response = await membershipApi.approveUser(userId);
      if (response.data.success) {
        toast.success(response.data.message);
        // Onay sonrası listeleri tekrar backend'den tazeleyerek "Gerçek Veri" akışını koru
        loadData();
      }
    } catch (error) {
      toast.error("Onaylama başarısız.");
    }
  };

  /**
   * handlePairing: Seçilen öğretmen ve öğrenciyi eşleştirir.
   */
  const handlePairing = async () => {
    if (!selectedTeacher || !selectedStudent) {
      toast.warning("Lütfen hem bir öğretmen hem de bir öğrenci seçin.");
      return;
    }
    try {
      const response = await membershipApi.pairStudentTeacher(selectedStudent, selectedTeacher);
      if (response.data.success) {
        toast.success("Eşleştirme başarıyla tamamlandı.");
        // Başarılı işlem sonrası seçimleri sıfırla
        setSelectedStudent(null);
      }
    } catch (error) {
      toast.error("Eşleştirme sırasında bir hata oluştu.");
    }
  };

  /**
   * Sidebar Item Bileşeni: Sol menüdeki her bir butonu temsil eder.
   */
  const SidebarItem = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
        activeTab === id 
        ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
        : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon className={`h-5 w-5 ${activeTab === id ? "text-cyan-400" : "group-hover:text-slate-900"}`} />
      <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
      {activeTab === id && <ChevronRight className="ml-auto h-4 w-4 text-cyan-400" />}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 py-32">
        <div className="w-10 h-10 border-[5px] border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Veriler Senkronize Ediliyor</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] gap-12 animate-in fade-in duration-700">
      
      {/* SaaS SIDEBAR */}
      <aside className="w-80 shrink-0 space-y-8">
        <div className="bg-white rounded-[3rem] p-4 shadow-xl shadow-slate-100/50 border border-slate-50">
          <div className="p-6 mb-4">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Yönetim Paneli</p>
             <h3 className="text-xl font-black text-slate-900 tracking-tighter">Navigasyon</h3>
          </div>
          <div className="space-y-2">
            <SidebarItem id="OVERVIEW" label="Genel Bakış" icon={LayoutDashboard} />
            <SidebarItem id="PENDING" label="Onay Bekleyenler" icon={Clock} />
            <SidebarItem id="PAIRING" label="Eşleştirme Merkezi" icon={Link2} />
          </div>
        </div>

        {/* Bilgi Kartı (Sidebar altı) */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
           <ShieldAlert className="h-10 w-10 text-cyan-400 mb-6" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/80 mb-2">Güvenlik Notu</p>
           <p className="text-xs font-bold leading-relaxed text-slate-300">
             Tüm yeni kayıtlar merkezi denetim birimi onayından geçmelidir.
           </p>
        </div>
      </aside>

      {/* ANA İÇERİK ALANI */}
      <main className="flex-1">
        {activeTab === "OVERVIEW" && (
          <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Sistem <span className="text-cyan-500 italic">Özeti</span></h2>
             <div className="grid grid-cols-2 gap-8">
                <Card className="rounded-[3rem] border-0 shadow-xl p-10 bg-white">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Aktif Kullanıcı Sayısı</p>
                   <p className="text-5xl font-black text-slate-900 tracking-tighter">
                     {activeTeachers.length + activeStudents.length}
                   </p>
                </Card>
                <Card className="rounded-[3rem] border-0 shadow-xl p-10 bg-slate-900 text-white">
                   <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Bekleyen Onaylar</p>
                   <p className="text-5xl font-black tracking-tighter">{pendingUsers.length}</p>
                </Card>
             </div>
          </div>
        )}

        {activeTab === "PENDING" && (
          <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
             <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Onay <span className="text-cyan-500 italic">Bekleyenler</span></h2>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                   <Search className="h-4 w-4 text-slate-400" />
                   <input type="text" placeholder="Hızlı ara..." className="bg-transparent border-0 text-xs font-bold focus:ring-0 outline-none w-40" />
                </div>
             </div>

             {pendingUsers.length === 0 ? (
               <div className="bg-white rounded-[4rem] p-32 text-center border-2 border-dashed border-slate-100">
                  <UserCheck className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Tüm başvurular sonuçlandırıldı.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                 {pendingUsers.map(user => (
                   <Card key={user.id} className="rounded-[2.5rem] border-0 shadow-lg hover:shadow-xl transition-all bg-white overflow-hidden group">
                     <CardContent className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 font-black text-xl border border-slate-100 shadow-inner">
                              {user.fullName.charAt(0)}
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-slate-900 tracking-tight">{user.fullName}</h4>
                              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-600 bg-cyan-50 px-3 py-1 rounded-lg">
                                 {user.role}
                              </span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => handleReject(user.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><XCircle /></button>
                           <button onClick={() => handleApprove(user.id)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 transition-all">Onayla</button>
                        </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             )}
          </div>
        )}

        {activeTab === "PAIRING" && (
          <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
             <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Eşleştirme <span className="text-cyan-500 italic">Merkezi</span></h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eğitmen ve Öğrenci bağlarını buradan kurun</p>
             </div>
             
             <div className="grid grid-cols-2 gap-8">
                {/* Öğretmen Seçim Alanı */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">1. Eğitmen Seçin ({activeTeachers.length})</p>
                   <div className="bg-white rounded-[3rem] p-6 shadow-xl border border-slate-50 min-h-[500px] max-h-[500px] overflow-y-auto space-y-3 custom-scrollbar">
                      {activeTeachers.length === 0 ? (
                        <p className="text-center text-slate-300 text-[10px] font-bold py-20">Aktif eğitmen bulunmuyor.</p>
                      ) : (
                        activeTeachers.map(teacher => (
                          <div 
                            key={teacher.id} 
                            onClick={() => setSelectedTeacher(teacher.id)}
                            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedTeacher === teacher.id ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                          >
                             <h5 className="font-black text-sm tracking-tight">{teacher.fullName}</h5>
                             <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${selectedTeacher === teacher.id ? 'text-cyan-400' : 'text-slate-400'}`}>{teacher.email}</p>
                          </div>
                        ))
                      )}
                   </div>
                </div>

                {/* Öğrenci Seçim Alanı */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">2. Öğrenci Seçin ({activeStudents.length})</p>
                   <div className="bg-white rounded-[3rem] p-6 shadow-xl border border-slate-50 min-h-[500px] max-h-[500px] overflow-y-auto space-y-3 custom-scrollbar">
                      {activeStudents.length === 0 ? (
                        <p className="text-center text-slate-300 text-[10px] font-bold py-20">Aktif öğrenci bulunmuyor.</p>
                      ) : (
                        activeStudents.map(student => (
                          <div 
                            key={student.id} 
                            onClick={() => setSelectedStudent(student.id)}
                            className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedStudent === student.id ? 'border-cyan-500 bg-cyan-50/50 shadow-lg' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                          >
                             <h5 className="font-black text-sm tracking-tight text-slate-900">{student.fullName}</h5>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{student.email}</p>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             </div>

             {/* Eşleştirme Butonu */}
             <button 
               onClick={handlePairing}
               disabled={!selectedTeacher || !selectedStudent}
               className={`w-full py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all shadow-2xl ${
                 !selectedTeacher || !selectedStudent 
                 ? "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none" 
                 : "bg-slate-900 text-white hover:bg-cyan-500 shadow-slate-200"
               }`}
             >
                {selectedTeacher && selectedStudent ? "Bağlantıyı Kur" : "Seçim Bekleniyor"}
             </button>
          </div>
        )}
      </main>
    </div>
  );

  // Helper function (Reddetme işlemi dashboard içinde tanımlanmalıydı, eksik kalmış)
  async function handleReject(userId: string) {
    try {
      const response = await membershipApi.rejectUser(userId);
      if (response.data.success) {
        toast.info(response.data.message);
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      toast.error("İşlem başarısız.");
    }
  }
}
