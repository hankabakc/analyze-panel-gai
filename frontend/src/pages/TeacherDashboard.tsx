import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { membershipApi, analysisApi } from "@/lib/api";
import type { User } from "@/lib/types";
import { toast } from "sonner";
import { Users, ChevronRight, Upload, FileBarChart2, Info, Sparkles, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * TeacherDashboard: Otonom analiz ve akıllı liste takibi (polling) yapan eğitmen paneli.
 */
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<User[]>([]);
  const [reports, setReports] = useState<any[]>([]); 
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Polling (Otomatik Tazeleme) için referans
  const pollingRef = useRef<any>(null);

  const fetchInitialData = async () => {
    try {
      const response = await membershipApi.getMyStudents();
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      toast.error("Öğrenci listeniz yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * fetchReports: Raporları getirir ve eğer "Analiz Ediliyor..." varsa polling başlatır.
   */
  const fetchReports = async (studentId: string, isAutoRefresh = false) => {
    if (!isAutoRefresh) setSelectedStudentId(studentId);
    
    try {
      const response = await analysisApi.getStudentReports(studentId);
      if (response.data.success) {
        const fetchedReports = response.data.data;
        setReports(fetchedReports);

        // Eğer listede hala "Analiz Ediliyor..." olan bir rapor varsa polling'i başlat/devam ettir
        const isStillProcessing = fetchedReports.some((r: any) => r.examTitle === "Analiz Ediliyor...");
        
        if (isStillProcessing) {
          if (!pollingRef.current) {
            console.log(">> [POLLING] Analiz devam ediyor, otomatik takip başlatıldı.");
            pollingRef.current = setInterval(() => fetchReports(studentId, true), 3000);
          }
        } else {
          stopPolling();
        }
      }
    } catch (error) {
      if (!isAutoRefresh) toast.error("Raporlar yüklenemedi.");
      stopPolling();
    }
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      console.log(">> [POLLING] Tüm analizler tamamlandı, takip durduruldu.");
    }
  };

  const handleFileUpload = async (studentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Otonom Süper Analiz başlatıldı...");
      const response = await analysisApi.uploadPdf(studentId, 0, 'AUTO', file);
      if (response.data.success) {
        toast.dismiss();
        toast.success("Dosya alındı! AI çalışmaya başladı.");
        // Hemen ilk sorguyu yap, bu zaten polling'i tetikleyecek
        fetchReports(studentId);
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Yükleme başarısız oldu.");
    } finally {
      event.target.value = '';
    }
  };

  // Sayfa kapanırken veya öğrenci değişirken polling'i temizle
  useEffect(() => {
    fetchInitialData();
    return () => stopPolling();
  }, []);

  if (isLoading) return (
    <div className="w-full flex flex-col items-center justify-center gap-6 py-32">
      <div className="w-10 h-10 border-[5px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Analiz Merkezi Yükleniyor</p>
    </div>
  );

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
          Eğitmen <span className="text-blue-500 italic">Paneli</span>
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Otonom Analiz & Öğrenci Takibi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* SOL: Öğrenci Listesi */}
        <div className="lg:col-span-1 space-y-6">
           <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-500" /> Öğrencilerim
           </h3>
           <div className="space-y-3">
              {students.map(student => (
                <div 
                  key={student.id}
                  onClick={() => {
                    stopPolling(); // Yeni öğrenciye geçerken eski polling'i durdur
                    fetchReports(student.id);
                  }}
                  className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all ${selectedStudentId === student.id ? 'border-blue-500 bg-blue-50/30 shadow-lg' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                >
                   <h5 className="font-black text-sm text-slate-900 tracking-tight">{student.fullName}</h5>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{student.email}</p>
                </div>
              ))}
           </div>
        </div>

        {/* SAĞ: Otonom Analiz Merkezi */}
        <div className="lg:col-span-2 space-y-8">
           {!selectedStudentId ? (
             <Card className="rounded-[4rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-32 text-center">
                <Info className="h-12 w-12 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Soldan bir öğrenci seçerek otonom analizi başlatın.</p>
             </Card>
           ) : (
             <div className="space-y-8 animate-in slide-in-from-bottom-5">
                
                {/* Otonom Yükleme Alanı */}
                <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-slate-50 flex flex-col items-center gap-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
                   <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200">
                         <Sparkles className="h-10 w-10 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                         <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">Süper Analist AI</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">PDF Dosyasını Atın, AI Türünü ve İçeriğini Kendi Belirlesin</p>
                      </div>
                   </div>

                   <label className="w-full max-w-md cursor-pointer bg-slate-900 text-white px-12 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all shadow-2xl shadow-blue-100 group">
                      <Upload className="h-5 w-5 group-hover:-translate-y-1 transition-transform" /> 
                      PDF Karne Analiz Et
                      <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(selectedStudentId, e)} />
                   </label>
                </div>

                {/* Rapor Listesi */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-4 mb-6">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Analiz Geçmişi</h3>
                      <button 
                        onClick={() => navigate(`/analysis/cumulative/${selectedStudentId}`)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
                      >
                        <Layers className="h-4 w-4" /> Tüm PDF'lerin Analizi
                      </button>
                   </div>
                   {reports.length === 0 ? (
                     <p className="text-center py-20 text-slate-400 text-[10px] font-black uppercase tracking-widest italic border-2 border-dashed border-slate-100 rounded-[3rem]">Henüz bir analiz raporu bulunmuyor.</p>
                   ) : (
                     reports.map(report => (
                       <Card 
                        key={report.id} 
                        onClick={() => navigate(`/analysis/${report.id}`)}
                        className={`rounded-[2.5rem] border-0 shadow-lg hover:shadow-xl transition-all bg-white group cursor-pointer overflow-hidden ${report.examTitle === "Analiz Ediliyor..." ? "opacity-60 pointer-events-none" : ""}`}
                       >
                          <CardContent className="p-8 flex items-center justify-between">
                             <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${report.examTitle === "Analiz Ediliyor..." ? "bg-blue-50 text-blue-500 animate-spin" : "bg-slate-50 text-slate-900"}`}>
                                   <FileBarChart2 className="h-6 w-6" />
                                </div>
                                <div>
                                   <div className="flex items-center gap-3">
                                      <h4 className="text-lg font-black text-slate-900 tracking-tight">
                                        {report.examTitle}
                                        {report.examTitle === "Analiz Ediliyor..." && <span className="ml-2 inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>}
                                      </h4>
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                        report.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                      }`}>
                                         {report.status === 'APPROVED' ? 'Yayımlandı' : 'Onay Bekliyor'}
                                      </span>
                                   </div>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                      {new Date(report.processedAt).toLocaleDateString('tr-TR')} • {report.intendedExamCount > 0 ? `${report.intendedExamCount} Deneme Verisi` : "Tür Tespit Ediliyor..."}
                                   </p>
                                </div>
                             </div>
                             <ChevronRight className="h-6 w-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </CardContent>
                       </Card>
                     ))
                   )}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
