import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { analysisApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context"; 
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { 
  ChevronLeft, Sparkles, Target, 
  CheckCircle2, AlertCircle, Send, Trash2, Milestone, 
  Lightbulb, Compass, Zap, Calendar, BarChart3, TrendingUp, HelpCircle, Layers, Filter,
  ChevronDown, School, Trophy, ArrowUpRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisData, TopicDetail } from "@/lib/types";

export default function AnalysisDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // GÖRÜNÜM MODU STATE (TEKİL VS KÜMÜLATİF)
  const [isCumulative, setIsCumulative] = useState(false);

  const [activeTab, setActiveTab] = useState<'PERFORMANCE' | 'MENTOR' | 'TARGET'>('PERFORMANCE');
  const [performanceView, setPerformanceView] = useState<'DATE' | 'NET'>('NET');
  const [scope, setScope] = useState<5 | 10>(5);
  
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<string[]>([]);
  const [highlightedTopicId, setHighlightedTopicId] = useState<string | null>(null);
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // OKUL ARAMA VE HEDEF GÜNCELLEME STATE'LERİ
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const fetchDetail = async () => {
    if (!reportId) return;
    try {
      const response = await analysisApi.getAnalysisDetail(reportId, isCumulative);
      if (response.data.success) {
        const reportData = response.data.data;
        setData(reportData);
        if (reportData.intendedExamCount === 10) setScope(10);
      }
    } catch (error) {
      toast.error("Analiz detayları yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await analysisApi.searchSchools(query);
      if (res.data.success) {
        setSearchResults(res.data.data);
      }
    } catch (e) {
      console.error("Okul arama hatası", e);
    }
  };

  const selectTargetSchool = async (schoolId: string) => {
    try {
      const res = await analysisApi.updateProfile(schoolId);
      if (res.data.success) {
        toast.success("Hedef okul başarıyla güncellendi!");
        setIsSearchModalOpen(false);
        fetchDetail();
      }
    } catch (e) {
      toast.error("Hedef güncellenirken bir hata oluştu.");
    }
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);
  };

  const navigateToTopic = (lessonId: string, topicId: string) => {
    if (!expandedLessons.includes(lessonId)) setExpandedLessons(prev => [...prev, lessonId]);
    setTimeout(() => {
      const element = scrollRefs.current[topicId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedTopicId(topicId);
        setTimeout(() => setHighlightedTopicId(null), 3000);
      }
    }, 150);
  };

  const renderInteractiveFeedback = (text: string) => {
    if (!data) return text;
    let elements: any[] = [text];
    
    const allTopicsWithLesson = data.consolidatedResult.lessons.flatMap(l => 
      l.topics.map(t => ({ 
        ...t, 
        lessonId: l.id, 
        cleanName: t.topicName.includes(" - ") ? t.topicName.split(" - ").pop()?.trim() || t.topicName : t.topicName 
      }))
    ).sort((a, b) => b.cleanName.length - a.cleanName.length);

    allTopicsWithLesson.forEach(topic => {
      if (topic.cleanName.length < 3) return;
      const topicRegex = new RegExp(`(${topic.cleanName})`, 'gi');
      elements = elements.flatMap(el => {
        if (typeof el !== 'string') return el;
        const parts = el.split(topicRegex);
        return parts.map((part, i) => 
          part.toLowerCase() === topic.cleanName.toLowerCase() 
          ? <button key={`t-${topic.id}-${i}`} onClick={() => navigateToTopic(topic.lessonId, topic.id)} className="text-cyan-600 font-black hover:text-blue-700 transition-colors cursor-pointer border-b-2 border-cyan-200 hover:border-blue-500 mx-1">{part}</button> 
          : part
        );
      });
    });
    return elements;
  };

  const getStatusUI = (topic: TopicDetail) => {
    const total = topic.totalQuestions || 0;
    const correct = topic.correctCount || 0;
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    if (percentage >= 85) return { color: "text-emerald-500", bg: "bg-emerald-50", icon: <CheckCircle2 className="h-4 w-4" /> };
    if (percentage >= 50) return { color: "text-amber-500", bg: "bg-amber-50", icon: <HelpCircle className="h-4 w-4" /> };
    return { color: "text-red-500", bg: "bg-red-50", icon: <AlertCircle className="h-4 w-4" /> };
  };

  const getGroupedTopics = (topics: TopicDetail[]) => {
    const displayTopics = showOnlyProblems ? topics.filter(t => (t.totalQuestions ? (t.correctCount || 0) / t.totalQuestions * 100 : 0) < 85) : topics;
    const groups: { [key: string]: TopicDetail[] } = {};
    const allMainTitles = new Set<string>();
    displayTopics.forEach(t => { if (t.topicName.includes(" - ")) allMainTitles.add(t.topicName.split(" - ")[0]); });
    const standalone: TopicDetail[] = [];
    displayTopics.forEach(topic => {
      if (topic.topicName.includes(" - ")) {
        const mainTitle = topic.topicName.split(" - ")[0];
        if (!groups[mainTitle]) groups[mainTitle] = [];
        groups[mainTitle].push(topic);
      } else if (!allMainTitles.has(topic.topicName)) { standalone.push(topic); }
    });
    return { groups, standalone };
  };

  const getFilteredLessons = () => {
    if (!data) return [];
    let lessons = [...data.consolidatedResult.lessons];
    if (scope !== data.intendedExamCount) {
      const multiplier = scope === 10 && data.intendedExamCount === 5 ? 2 : 0.5;
      lessons = lessons.map(l => ({ ...l, correct: Math.round(l.correct * multiplier), wrong: Math.round(l.wrong * multiplier), empty: Math.round(l.empty * multiplier) }));
    }
    if (performanceView === 'NET') lessons.sort((a, b) => b.successRate - a.successRate);
    return lessons;
  };

  const getExamHistoryData = () => {
    if (!data || !data.examList) return [];
    return [...data.examList].sort((a, b) => {
        const dateA = a.examDate.split('.').reverse().join('-');
        const dateB = b.examDate.split('.').reverse().join('-');
        return dateA.localeCompare(dateB);
    });
  };

  const currentScoreAverage = useMemo(() => {
    if (!data || !data.examList || data.examList.length === 0) return 0;
    const sum = data.examList.reduce((acc, curr) => acc + Number(curr.totalScore || 0), 0);
    return sum / data.examList.length;
  }, [data]);

  const targetGap = data?.targetSchoolScore ? data.targetSchoolScore - currentScoreAverage : 0;
  const compatibilityPercent = data?.targetSchoolScore ? Math.min(100, Math.max(0, (currentScoreAverage / data.targetSchoolScore) * 100)) : 0;

  const handleApprove = async () => { if (!reportId) return; try { const res = await analysisApi.approveReport(reportId); if (res.data.success) { toast.success("Onaylandı."); if (data) setData({ ...data, status: 'APPROVED' }); } } catch (e) { toast.error("Hata"); } };
  const handleReject = async () => { if (!reportId) return; try { const res = await analysisApi.rejectReport(reportId); if (res.data.success) { toast.info("Reddedildi."); navigate(-1); } } catch (e) { toast.error("Hata"); } };
  const handleDelete = async () => { if (!reportId || !window.confirm("Emin misiniz?")) return; try { const res = await analysisApi.deleteReport(reportId); if (res.data.success) { toast.success("Silindi."); navigate(-1); } } catch (e) { toast.error("Hata"); } };

  useEffect(() => { fetchDetail(); }, [reportId, isCumulative]);

  if (isLoading) return <div className="flex-1 flex flex-col items-center justify-center gap-6 py-32"><div className="w-12 h-12 border-[6px] border-cyan-500 border-t-transparent rounded-full animate-spin"></div><p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Yükleniyor...</p></div>;
  if (!data) return null;

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* ÜST NAVİGASYON */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"><ChevronLeft className="h-4 w-4" /> Geri Dön</button>
          {(user?.role === 'TEACHER' || user?.role === 'MANAGER') && <button onClick={handleDelete} className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"><Trash2 className="h-5 w-5" /></button>}
        </div>
        <div className="flex items-center gap-8">
           {/* GÖRÜNÜM MODU ANAHTARI */}
           <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              <button onClick={() => setIsCumulative(false)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isCumulative ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Sınav Karnesi</button>
              <button onClick={() => setIsCumulative(true)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isCumulative ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-105' : 'text-slate-400 hover:text-slate-600'}`}><Layers className="h-3.5 w-3.5" /> Gelişim Dosyası</button>
           </div>

           {user?.role === 'TEACHER' && data.status === 'PENDING_APPROVAL' && (
             <div className="flex items-center gap-3">
                <button onClick={handleReject} className="bg-red-50 text-red-500 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-100">Reddet</button>
                <button onClick={handleApprove} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100"><Send className="h-4 w-4" /> Onayla ve Yayınla</button>
             </div>
           )}
           <div className="text-right"><h2 className="text-3xl font-black text-slate-900 tracking-tighter">{isCumulative ? "GELİŞİM DOSYASI" : data.examTitle}</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{isCumulative ? "Tüm Zamanların Birleşimi" : (data.reportType === 'SUMMARY' ? "5'li Gelişim Özeti" : 'Tekil Deneme Analizi')}</p></div>
        </div>
      </div>

      <div className="flex items-center justify-center">
         <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-slate-50 flex items-center gap-2">
            <button onClick={() => setActiveTab('PERFORMANCE')} className={`px-10 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'PERFORMANCE' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Zap className="h-4 w-4" /> Performans</button>
            <button onClick={() => setActiveTab('MENTOR')} className={`px-10 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'MENTOR' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Sparkles className="h-4 w-4" /> Analiz Uzmanı</button>
            <button onClick={() => setActiveTab('TARGET')} className={`px-10 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'TARGET' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Target className="h-4 w-4" /> Hedef & Tahmin</button>
         </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
        {activeTab === 'PERFORMANCE' && (
          <div className="space-y-12">
             <Card className="rounded-[3rem] border-0 shadow-xl bg-white p-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                   <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3"><BarChart3 className="h-6 w-6 text-blue-500" /> {performanceView === 'NET' ? 'Ders Başarı Analizi' : 'Sınav Net Gelişimi'}</h4>
                   <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                      <button onClick={() => setPerformanceView('DATE')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 transition-all ${performanceView === 'DATE' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><Calendar className="h-3.5 w-3.5" /> Tarihe Göre</button>
                      <button onClick={() => setPerformanceView('NET')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 transition-all ${performanceView === 'NET' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><TrendingUp className="h-3.5 w-3.5" /> Nete Göre</button>
                   </div>
                </div>
                <div className="h-[400px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      {performanceView === 'NET' ? (
                        <BarChart data={getFilteredLessons()}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="lessonName" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} /><YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} /><Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} /><Bar dataKey="correct" name="Doğru" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={30} /><Bar dataKey="wrong" name="Yanlış" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={30} />
                        </BarChart>
                      ) : (
                        <AreaChart data={getExamHistoryData()}>
                           <defs><linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="examDate" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} /><YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} /><Tooltip /><Area type="monotone" dataKey="totalScore" name="Tahmini Puan" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorNet)" />
                        </AreaChart>
                      )}
                   </ResponsiveContainer>
                </div>
             </Card>
             <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight ml-4 flex items-center gap-3"><Milestone className="h-6 w-6 text-blue-500" /> Sınav Tarihçesi</h3>
                <Card className="rounded-[3rem] border-0 shadow-xl bg-white overflow-hidden"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50 border-b border-slate-100"><th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Sınav Adı</th><th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Tarih</th><th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Puan</th><th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Durum</th></tr></thead><tbody>{getExamHistoryData().map((exam, i) => (<tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"><td className="px-10 py-6 font-black text-sm text-slate-900">{exam.examName}</td><td className="px-10 py-6 text-xs font-bold text-slate-500">{exam.examDate}</td><td className="px-10 py-6 text-center"><span className="text-lg font-black text-blue-600">{Number(exam.totalScore).toFixed(1)}</span></td><td className="px-10 py-6 text-right"><span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">Analiz Edildi</span></td></tr>))}</tbody></table></Card>
             </div>
          </div>
        )}

        {activeTab === 'MENTOR' && (
          <div className="space-y-8">
             <Card className="rounded-[4rem] border-0 shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-12 relative overflow-hidden"><div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10"><div className="flex items-center gap-10"><div className="w-24 h-24 rounded-[2.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0"><Lightbulb className="h-12 w-12 text-yellow-300 shadow-xl" /></div><div className="space-y-4"><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-100">Stratejik Öncelik</h3><h2 className="text-3xl font-black tracking-tight leading-none italic">{data.strategicPriority || "Hesaplanıyor..."}</h2></div></div><button onClick={() => setShowOnlyProblems(!showOnlyProblems)} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl ${showOnlyProblems ? 'bg-amber-500 text-white scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}><Filter className="h-4 w-4" />{showOnlyProblems ? 'Tüm Konuları Göster' : 'Sadece Sorunlu Konular'}</button></div></Card>
             
             {/* ÖĞRETMEN ÖZEL AKSİYON PLANI (SADECE ÖĞRETMEN/MANAGER GÖRÜR) */}
             {(user?.role === 'TEACHER' || user?.role === 'MANAGER') && data.teacherActionPlan && (
               <Card className="rounded-[3rem] border-0 shadow-2xl bg-slate-900 text-white p-12 space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                  <div className="relative z-10 flex items-center gap-6">
                     <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30"><Zap className="h-6 w-6" /></div>
                     <div><h4 className="font-black text-sm uppercase tracking-[0.3em] text-emerald-400">Öğretmen Aksiyon Planı</h4><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Sadece sizin görebileceğiniz AI Stratejisi</p></div>
                  </div>
                  <div className="relative z-10 p-8 bg-white/5 rounded-[2rem] border border-white/5 backdrop-blur-sm"><p className="text-slate-100 font-bold leading-relaxed text-xl italic whitespace-pre-line">{data.teacherActionPlan}</p></div>
                  <div className="relative z-10"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">* Bu bilgiler AI tarafından sadece öğretmenin stratejik planlaması için üretilmiştir.</p></div>
               </Card>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card className="rounded-[3rem] border-0 shadow-xl bg-white p-12 space-y-8 lg:sticky lg:top-8"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Sparkles className="h-6 w-6" /></div><h4 className="font-black text-sm uppercase tracking-widest text-slate-900">Mentor Tavsiyeleri</h4></div><div className="text-slate-600 font-bold leading-loose text-lg whitespace-pre-line italic">{renderInteractiveFeedback(data.mentorFeedback || data.globalFeedback)}</div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-6 italic">* Mavi renkli konulara tıklayarak listedeki yerini görebilirsin.</p></Card>
                <div className="space-y-6">
                   {data.consolidatedResult.lessons.map(lesson => {
                      const { groups, standalone } = getGroupedTopics(lesson.topics);
                      if (showOnlyProblems && Object.keys(groups).length === 0 && standalone.length === 0) return null;
                      const isExpanded = expandedLessons.includes(lesson.id);
                      return (<Card key={lesson.id} className="rounded-[2.5rem] border-0 shadow-lg bg-white overflow-hidden"><div onClick={() => toggleLesson(lesson.id)} className="bg-slate-50 px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-100 group"><div className="flex items-center gap-4"><div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-white text-slate-400 group-hover:bg-blue-50'}`}><ChevronDown className="h-5 w-5" /></div><span className="font-black text-xs uppercase tracking-widest text-slate-700">{lesson.lessonName}</span></div><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">%{lesson.successRate} Başarı</span></div>{isExpanded && (<CardContent className="p-8 space-y-6 animate-in slide-in-from-top-2 duration-300">{Object.keys(groups).map(mainTitle => (<div key={mainTitle} className="space-y-3"><div className="flex items-center gap-3 px-2"><Layers className="h-4 w-4 text-slate-400" /><span className="font-black text-[11px] uppercase tracking-widest text-slate-900">{mainTitle}</span></div><div className="space-y-2 border-l-2 border-slate-100 ml-4 pl-4">{groups[mainTitle].map(topic => { const ui = getStatusUI(topic); const isHigh = highlightedTopicId === topic.id; return (<div key={topic.id} ref={el => { scrollRefs.current[topic.id] = el; }} className={`flex items-center justify-between group p-3 rounded-xl transition-all duration-700 ${isHigh ? 'bg-yellow-400/40 scale-105 shadow-[0_0_30px_rgba(250,204,21,0.6)] border-2 border-yellow-400 z-20 animate-pulse' : 'hover:bg-slate-50'}`}><div className="flex items-center gap-3"><div className={`${ui.color} ${ui.bg} p-1.5 rounded-lg shadow-sm`}>{ui.icon}</div><span className={`font-bold text-xs ${isHigh ? 'text-slate-900' : 'text-slate-600'} italic`}>{topic.topicName.split(" - ").pop()}</span></div><div className="text-[9px] font-black text-slate-400 uppercase">SS: {topic.totalQuestions || '--'} | D: {topic.correctCount || 0}</div></div>); })}</div></div>))}{standalone.length > 0 && (<div className="space-y-2 pt-4 border-t border-slate-50">{standalone.map(topic => { const ui = getStatusUI(topic); const isHigh = highlightedTopicId === topic.id; return (<div key={topic.id} ref={el => { scrollRefs.current[topic.id] = el; }} className={`flex items-center justify-between group p-3 rounded-xl transition-all duration-700 ${isHigh ? 'bg-yellow-400/40 scale-105 shadow-[0_0_30px_rgba(250,204,21,0.6)] border-2 border-yellow-400 z-20 animate-pulse' : 'hover:bg-slate-50'}`}><div className="flex items-center gap-3"><div className={`${ui.color} ${ui.bg} p-1.5 rounded-lg shadow-sm`}>{ui.icon}</div><span className={`font-bold text-xs ${isHigh ? 'text-slate-900' : 'text-slate-600'} italic`}>{topic.topicName}</span></div><div className="text-[9px] font-black text-slate-400 uppercase">SS: {topic.totalQuestions || '--'} | D: {topic.correctCount || 0}</div></div>); })}</div>)}</CardContent>)}</Card>);
                   })}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'TARGET' && (
          <div className="space-y-12">
             {/* OKUL SEÇME MODALI */}
             {isSearchModalOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
                  <Card className="w-full max-w-2xl rounded-[3rem] border-0 shadow-2xl bg-white overflow-hidden">
                     <div className="p-10 space-y-8">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-100"><School className="h-6 w-6" /></div>
                              <h4 className="font-black text-xl text-slate-900 tracking-tight">Hedef Okul Seç</h4>
                           </div>
                           <button onClick={() => setIsSearchModalOpen(false)} className="p-3 text-slate-400 hover:text-slate-900 transition-colors"><Trash2 className="h-5 w-5" /></button>
                        </div>
                        <div className="relative">
                           <input type="text" placeholder="Okul adı veya şehir ara..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-8 py-5 font-bold text-slate-700 focus:outline-none focus:border-cyan-500 transition-all" value={searchQuery} onChange={(e) => handleSchoolSearch(e.target.value)} autoFocus />
                           {searchResults.length > 0 && (
                             <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden z-20 max-h-[300px] overflow-y-auto">
                                {searchResults.map((school) => (
                                  <button key={school.id} onClick={() => selectTargetSchool(school.id)} className="w-full px-8 py-5 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors group flex items-center justify-between">
                                     <div><p className="font-black text-slate-900 group-hover:text-cyan-600 transition-colors">{school.schoolName}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{school.city} • {school.schoolType}</p></div>
                                     <div className="text-right"><p className="font-black text-cyan-600">Puan: {school.baseScore}</p><p className="text-[9px] font-bold text-slate-300">Yüzdelik: %{school.percentile}</p></div>
                                  </button>
                                ))}
                             </div>
                           )}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center italic">* 2025 LGS TABAN PUANLARI REFERANS ALINMAKTADIR</p>
                     </div>
                  </Card>
               </div>
             )}

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* HEDEF OKUL KARTI */}
                <Card 
                  onClick={() => user?.role === 'STUDENT' && setIsSearchModalOpen(true)}
                  className={`lg:col-span-2 rounded-[4rem] border-0 shadow-2xl bg-slate-900 text-white p-12 relative overflow-hidden transition-all ${user?.role === 'STUDENT' ? 'cursor-pointer group hover:scale-[1.02]' : 'cursor-default'}`}
                >
                   <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:bg-cyan-500/20 transition-all"></div>
                   <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-2xl shadow-cyan-500/20 group-hover:scale-110 transition-transform"><School className="h-12 w-12 text-cyan-400" /></div>
                      <div className="space-y-4 flex-1">
                         <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Hedeflenen Kurum</h3>
                            {user?.role === 'STUDENT' && <span className="text-[9px] font-black bg-white/10 px-4 py-2 rounded-xl text-white/60 uppercase tracking-widest group-hover:bg-cyan-500 group-hover:text-white transition-all">Hedefi Değiştir</span>}
                         </div>
                         <h2 className="text-4xl font-black tracking-tight leading-tight uppercase">{data.targetSchoolName || "Hedef Belirlenmedi"}</h2>
                         {data.targetSchoolScore && (
                           <div className="flex items-center gap-6 mt-4">
                              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/10"><Trophy className="h-4 w-4 text-yellow-400" /><span className="text-sm font-bold text-white">Taban Puan: {data.targetSchoolScore}</span></div>
                              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/10"><TrendingUp className="h-4 w-4 text-cyan-400" /><span className="text-sm font-bold text-white">Senin Puan Ortalaman: {currentScoreAverage.toFixed(2)}</span></div>
                           </div>
                         )}
                      </div>
                   </div>
                </Card>

                {/* UYUM SKORU KARTI */}
                <Card className="rounded-[4rem] border-0 shadow-2xl bg-white p-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
                   <div className={`w-32 h-32 rounded-full border-[10px] flex items-center justify-center transition-all duration-1000 ${compatibilityPercent > 80 ? 'border-emerald-500 text-emerald-600' : compatibilityPercent > 50 ? 'border-amber-500 text-amber-600' : 'border-red-500 text-red-600'}`}><span className="text-3xl font-black">%{compatibilityPercent.toFixed(0)}</span></div>
                   <div><h4 className="font-black text-slate-900 text-sm uppercase tracking-widest">Hedef Uyumu</h4><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">LGS Puan Eşleşme Skoru</p></div>
                </Card>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Card className="rounded-[3rem] border-0 shadow-xl bg-emerald-900 text-white p-12 space-y-8 relative overflow-hidden">
                   <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -ml-20 -mb-20"></div>
                   <div className="relative z-10 flex items-center gap-6"><Compass className="h-10 w-10 text-emerald-400" /><h4 className="font-black text-sm uppercase tracking-widest">Gelecek Projeksiyonu</h4></div>
                   <p className="relative z-10 text-emerald-50 font-bold leading-relaxed text-2xl italic">"{data.futureProjection || "Projeksiyon oluşturmak için veriler analiz ediliyor..."}"</p>
                </Card>
                <div className="space-y-8">
                   <Card className="rounded-[3rem] border-0 shadow-xl bg-white p-12 space-y-8">
                      <div className="flex items-center gap-4"><div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center"><ArrowUpRight className="h-6 w-6" /></div><h4 className="font-black text-sm uppercase tracking-widest text-slate-900">Hedef Mesafesi (Puan)</h4></div>
                      <div className="space-y-6">
                         {targetGap > 0 ? (
                           <div className="p-8 bg-red-50 rounded-[2rem] border-2 border-red-100"><p className="text-red-900 font-bold text-lg leading-snug">Hedeflediğin okula ulaşmak için projeksiyonunun <span className="text-2xl font-black">+{targetGap.toFixed(2)}</span> puan daha üzerine çıkmalısın.</p></div>
                         ) : data.targetSchoolScore ? (
                           <div className="p-8 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100"><p className="text-emerald-900 font-bold text-lg leading-snug">Tebrikler! Mevcut performansın hedeflediğin okulun <span className="text-2xl font-black">{Math.abs(targetGap).toFixed(2)}</span> puan üzerinde.</p></div>
                         ) : (<p className="text-slate-400 font-bold italic">Hedef analizi için lütfen profilinden bir okul seç.</p>)}
                      </div>
                   </Card>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
