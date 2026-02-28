import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { membershipApi, analysisApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { User } from "@/lib/types";
import { toast } from "sonner";
import { Briefcase, FileBarChart2, ChevronRight, Target, School, Search, Trophy, X, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hedef Belirleme Modal State'leri
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [schools, setSchools] = useState<any[]>([]);
  const [isSearching, setIsSchoolsSearching] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [teachersRes, reportsRes, profileRes] = await Promise.all([
        membershipApi.getMyTeachers(),
        analysisApi.getStudentReports(user.id),
        analysisApi.getProfile()
      ]);
      
      if (teachersRes.data.success) setTeachers(teachersRes.data.data);
      if (reportsRes.data.success) setReports(reportsRes.data.data);
      if (profileRes.data.success) setProfile(profileRes.data.data);
    } catch (error) {
      toast.error("Verileriniz yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSchools = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSchools([]);
      return;
    }
    setIsSchoolsSearching(true);
    try {
      const res = await analysisApi.searchSchools(query);
      if (res.data.success) setSchools(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSchoolsSearching(false);
    }
  };

  const selectSchool = async (school: any) => {
    try {
      const res = await analysisApi.updateProfile(school.id, school.baseScore);
      if (res.data.success) {
        toast.success(`Hedef okul ${school.schoolName} olarak güncellendi!`);
        setShowTargetModal(false);
        fetchData();
      }
    } catch (error) {
      toast.error("Hedef güncellenemedi.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (isLoading) return (
    <div className="w-full flex flex-col items-center justify-center gap-6 py-32">
      <div className="w-10 h-10 border-[5px] border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Öğrenci Paneli Yükleniyor</p>
    </div>
  );

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* ÜST KARŞILAMA VE HEDEF KARTI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center gap-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Merhaba, <span className="text-cyan-500 italic">{user?.fullName.split(' ')[0]}</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Akademik Gelişim Merkezi</p>
        </div>

        <Card className="rounded-[3rem] border-0 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
           <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Target className="h-8 w-8 text-cyan-400" />
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-1">Akademik Hedefin</h4>
                    <p className="font-bold text-lg leading-tight">
                       {profile?.targetSchoolName ? profile.targetSchoolName : (profile?.targetScore ? `Hedef Puan: ${profile.targetScore}` : 'Henüz hedef belirlenmedi')}
                    </p>
                 </div>
              </div>
              <button 
                onClick={() => setShowTargetModal(true)}
                className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 hover:text-white transition-all shadow-xl shadow-black/20"
              >
                {profile?.targetSchoolId ? 'Hedefi Güncelle' : 'Hedef Belirle'}
              </button>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
           <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3"><FileBarChart2 className="h-6 w-6 text-cyan-500" /> Analiz Raporlarım</h3>
           {reports.length === 0 ? (
             <Card className="rounded-[4rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-24 text-center">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Henüz bir analiz raporun bulunmuyor.</p>
             </Card>
           ) : (
             <div className="grid grid-cols-1 gap-4">
                {reports.map(report => (
                  <Card key={report.id} onClick={() => navigate(`/analysis/${report.id}`)} className="rounded-[2.5rem] border-0 shadow-lg hover:shadow-xl transition-all bg-white group cursor-pointer overflow-hidden">
                    <CardContent className="p-8 flex items-center justify-between">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center"><FileBarChart2 className="h-6 w-6" /></div>
                          <div>
                             <h4 className="text-lg font-black text-slate-900 tracking-tight">{report.examTitle}</h4>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {new Date(report.processedAt).toLocaleDateString('tr-TR')} • {report.intendedExamCount} Deneme Verisi
                             </p>
                          </div>
                       </div>
                       <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                    </CardContent>
                  </Card>
                ))}
             </div>
           )}
        </div>

        <div className="lg:col-span-1 space-y-8">
           <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Briefcase className="h-6 w-6 text-cyan-500" /> Eğitmenlerim</h3>
           <div className="space-y-4">
              {teachers.map(teacher => (
                <Card key={teacher.id} className="rounded-[2.5rem] border-0 shadow-md bg-white overflow-hidden">
                   <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 font-black">{teacher.fullName.charAt(0)}</div>
                      <div>
                         <h5 className="font-black text-sm text-slate-900 tracking-tight">{teacher.fullName}</h5>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{teacher.email}</p>
                      </div>
                   </CardContent>
                </Card>
              ))}
           </div>
        </div>
      </div>

      {/* HEDEF BELİRLEME MODALI */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/40 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-cyan-500 text-white rounded-3xl flex items-center justify-center"><School className="h-8 w-8" /></div>
                    <div><h3 className="text-2xl font-black tracking-tight">Hedef Okulunu Seç</h3><p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-1">2025 LGS Referans Verileri</p></div>
                 </div>
                 <button onClick={() => setShowTargetModal(false)} className="p-4 hover:bg-white/10 rounded-2xl transition-all"><X className="h-6 w-6" /></button>
              </div>
              
              <div className="p-10 space-y-8">
                 <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Okul adı veya şehir yazın... (Örn: Ankara Fen)"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-6 pl-16 pr-8 font-bold text-sm focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                      value={searchQuery}
                      onChange={(e) => handleSearchSchools(e.target.value)}
                    />
                 </div>

                 <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                    {isSearching ? (
                      <div className="text-center py-10"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-[10px] font-black uppercase text-slate-400">Okullar taranıyor...</p></div>
                    ) : schools.length > 0 ? (
                      schools.map(school => (
                        <div 
                          key={school.id}
                          onClick={() => selectSchool(school)}
                          className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] hover:bg-cyan-50 hover:border-cyan-100 border-2 border-transparent transition-all cursor-pointer group"
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-cyan-500 shadow-sm"><MapPin className="h-5 w-5" /></div>
                              <div>
                                 <h5 className="font-black text-sm text-slate-900 leading-tight">{school.schoolName}</h5>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{school.city} • {school.schoolType}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="flex items-center gap-2 justify-end text-cyan-600"><Trophy className="h-4 w-4" /><span className="text-lg font-black">{school.baseScore}</span></div>
                              <p className="text-[9px] font-black text-slate-400 uppercase mt-1">Dilim: %{school.percentile}</p>
                           </div>
                        </div>
                      ))
                    ) : searchQuery.length >= 3 ? (
                      <div className="text-center py-10 text-slate-400"><p className="text-[10px] font-black uppercase">Sonuç bulunamadı.</p></div>
                    ) : (
                      <div className="text-center py-10 text-slate-300"><p className="text-[10px] font-black uppercase">Arama yapmak için en az 3 harf girin.</p></div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
