import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Smartphone, ShieldCheck, UserPlus, ArrowRight, 
  GraduationCap, Briefcase, Lock, Mail 
} from "lucide-react";

/**
 * AuthController: Giriş ve Kayıt süreçlerini yöneten ana kullanıcı arayüzü kontrolörüdür.
 * Bu bileşen; Giriş (LOGIN) ve Kayıt (REGISTER) sekmeleri arasındaki geçişi,
 * kayıt sürecindeki aşamalı formu (Step-by-Step) ve form verilerini yönetir.
 */
export function AuthController() {
  // AuthContext üzerinden global yetkilendirme fonksiyonlarını alıyoruz.
  const { login, sendOtp, verifyOtp, register } = useAuth();
  
  // activeTab: Kullanıcının Giriş mi yoksa Kayıt mı yapacağını belirler.
  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  
  // loginForm: Giriş ekranındaki e-posta ve şifre bilgilerini tutan yerel state.
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  
  /** 
   * Kayıt Akışı State Yönetimi:
   * regStep: Kayıt sürecindeki aktif adımı belirtir.
   * phone -> Telefon numarasını girme aşaması.
   * otp   -> Gelen SMS kodunu doğrulama aşaması.
   * form  -> Profil detaylarını (Ad, E-posta, Rol) doldurma aşaması.
   */
  const [regStep, setRegStep] = useState<"phone" | "otp" | "form">("phone");
  const [regPhone, setRegPhone] = useState(""); // Kayıt olacak telefon numarası
  const [otp, setOtp] = useState("");           // Girilen OTP kodu
  const [regData, setRegData] = useState({ fullName: "", email: "", password: "", role: "STUDENT" as any });

  /**
   * handleLogin: Giriş formunu backend'e gönderir.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginForm.email, loginForm.password);
  };

  /**
   * handleSendOtp: Telefon numarasına OTP gönderilmesini tetikler.
   * Başarılıysa bir sonraki adıma (OTP doğrulama) geçirir.
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    // Telefon numarası uzunluk kontrolü (Basit validasyon)
    if (regPhone.length < 10) return;
    try {
      await sendOtp(regPhone);
      setRegStep("otp"); // OTP adımına geç
    } catch (err) {
      // Hatalar auth-context içinde yakalanıp kullanıcıya bildiriliyor.
    }
  };

  /**
   * handleVerifyOtp: Girilen OTP kodunu backend üzerinden doğrular.
   * Doğruysa kullanıcıyı profil detaylarını dolduracağı son forma geçirir.
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await verifyOtp(regPhone, otp);
    if (isValid) setRegStep("form"); // Profil formu adımına geç
  };

  /**
   * handleRegister: Tüm profil verilerini toplayarak nihai kayıt işlemini gerçekleştirir.
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ ...regData, phoneNumber: regPhone });
    } catch (err) {
      // Hatalar merkezi hata yakalayıcı tarafından toast ile gösterilir.
    }
  };

  /**
   * renderLogin: Giriş arayüzünü (E-posta/Şifre) döner.
   * Tasarımda 'premium' bir hava oluşturmak için koyu (slate-900) ve sade bir dil kullanılmıştır.
   */
  const renderLogin = () => (
    <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-10 duration-700 select-none">
      <Card className="rounded-[3rem] border-0 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] overflow-hidden bg-white cursor-default">
        {/* Görsel ayırıcı üst bant */}
        <div className="h-2 bg-slate-900"></div>
        <CardContent className="p-12">
          {/* Başlık ve İkon Alanı */}
          <div className="flex flex-col items-center text-center mb-10 select-none">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100/50 shadow-inner">
              <Lock className="h-9 w-9 text-slate-800" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Giriş Yap</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Kurumsal erişim için e-posta girin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* E-Posta Alanı */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 select-none">E-Posta Adresi</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <Input 
                  type="email"
                  placeholder="isim@sirket.com" 
                  value={loginForm.email} 
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})} 
                  className="h-16 pl-14 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-slate-900 font-bold transition-all"
                />
              </div>
            </div>
            {/* Şifre Alanı */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 select-none">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <Input 
                  type="password"
                  placeholder="••••••••" 
                  value={loginForm.password} 
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                  className="h-16 pl-14 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-slate-900 font-bold transition-all"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest bg-slate-900">
              Sisteme Gir <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {/* Sekme Değiştirici */}
            <button type="button" onClick={() => setActiveTab("REGISTER")} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-cyan-600 transition-colors py-2">Hesabınız yok mu? Kayıt Olun</button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  /**
   * renderRegister: Kayıt sürecindeki aşamaları döner.
   * regStep state'ine göre kullanıcıya Telefon, OTP veya Profil formu gösterilir.
   */
  const renderRegister = () => {
    switch (regStep) {
      case "phone": // Adım 1: Telefon Numarası
        return (
          <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-right-10 duration-500 select-none">
            <Card className="rounded-[3rem] border-0 shadow-2xl bg-white overflow-hidden cursor-default">
              <div className="h-2 bg-cyan-500"></div>
              <CardContent className="p-12">
                <div className="text-center mb-10 select-none">
                  <div className="w-20 h-20 bg-cyan-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-cyan-100">
                    <Smartphone className="h-9 w-9 text-cyan-600" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Hesap Oluştur</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Doğrulama için numaranızı girin</p>
                </div>
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <Input 
                    placeholder="5xx xxx xx xx" 
                    value={regPhone} 
                    onChange={e => setRegPhone(e.target.value)} 
                    className="h-16 rounded-2xl border-2 border-slate-50 bg-slate-50 text-lg font-black tracking-widest text-center"
                  />
                  <Button type="submit" className="w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest bg-cyan-500 text-white">
                    Doğrulama Kodu Gönder
                  </Button>
                  <button type="button" onClick={() => setActiveTab("LOGIN")} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 py-2">Zaten üye misiniz? Giriş Yapın</button>
                </form>
              </CardContent>
            </Card>
          </div>
        );
      case "otp": // Adım 2: OTP Doğrulama
        return (
          <div className="w-full max-w-[440px] animate-in zoom-in-95 duration-500 select-none">
            <Card className="rounded-[3rem] border-0 shadow-2xl bg-white overflow-hidden cursor-default">
              <div className="h-2 bg-blue-500"></div>
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-blue-100">
                  <ShieldCheck className="h-9 w-9 text-blue-600" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-10">Kodu Doğrula</h2>
                <form onSubmit={handleVerifyOtp} className="space-y-8">
                  <Input 
                    placeholder="000000" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value)} 
                    className="h-20 rounded-[2rem] border-2 border-slate-50 bg-slate-50 text-center text-4xl font-black tracking-[0.4em]"
                  />
                  <Button type="submit" className="w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest bg-blue-600">
                    Devam Et
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        );
      case "form": // Adım 3: Profil Detayları
        return (
          <div className="w-full max-w-[560px] animate-in fade-in slide-in-from-right-10 duration-700 select-none">
            <Card className="rounded-[4rem] border-0 shadow-2xl bg-white overflow-hidden cursor-default">
              <div className="h-2 bg-emerald-500"></div>
              <CardContent className="p-14">
                <div className="text-center mb-10 select-none">
                  <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                    <UserPlus className="h-9 w-9 text-emerald-600" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Profil Detayları</h2>
                </div>
                <form onSubmit={handleRegister} className="space-y-6">
                  {/* Grid Yapısı: Ad Soyad ve E-Posta yan yana */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ad Soyad</label>
                      <Input 
                        placeholder="Ad Soyad" 
                        onChange={e => setRegData({...regData, fullName: e.target.value})} 
                        className="h-16 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold px-6"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-Posta</label>
                      <Input 
                        type="email"
                        placeholder="E-Posta" 
                        onChange={e => setRegData({...regData, email: e.target.value})} 
                        className="h-16 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold px-6"
                      />
                    </div>
                  </div>
                  {/* Şifre Belirleme */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Şifre Belirle</label>
                    <Input 
                      type="password"
                      placeholder="••••••••" 
                      onChange={e => setRegData({...regData, password: e.target.value})} 
                      className="h-16 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold px-6"
                    />
                  </div>
                  {/* Rol Seçimi: Kart tasarımıyla kullanıcı dostu seçim alanı */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setRegData({...regData, role: 'STUDENT'})}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${regData.role === 'STUDENT' ? 'border-cyan-500 bg-cyan-50/30 shadow-lg' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}
                    >
                      <GraduationCap className={`h-8 w-8 ${regData.role === 'STUDENT' ? 'text-cyan-600' : 'text-slate-300'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Öğrenci</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRegData({...regData, role: 'TEACHER'})}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${regData.role === 'TEACHER' ? 'border-blue-500 bg-blue-50/30 shadow-lg' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}
                    >
                      <Briefcase className={`h-8 w-8 ${regData.role === 'TEACHER' ? 'text-blue-600' : 'text-slate-300'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Eğitmen</span>
                    </button>
                  </div>
                  <Button type="submit" className="w-full h-20 rounded-[2.5rem] font-black text-base uppercase tracking-widest bg-slate-900 mt-6 shadow-xl shadow-slate-200">
                    Kaydı Tamamla
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  // Ana kapsayıcı: Ekran boyutuna göre formu ortalar.
  return <div className="w-full flex justify-center">{activeTab === "LOGIN" ? renderLogin() : renderRegister()}</div>;
}
