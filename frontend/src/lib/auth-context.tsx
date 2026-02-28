import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "./types";
import api, { authApi } from "./api";
import { toast } from "sonner";

/**
 * AuthContextType: Kimlik doğrulama bağlamında sunulan tüm fonksiyon ve verilerin tipi.
 */
interface AuthContextType {
  user: User | null;         // Giriş yapmış kullanıcının bilgileri
  isAuthenticated: boolean;  // Oturumun açık olup olmadığı
  isLoading: boolean;        // İlk yükleme aşamasında mı?
  login: (email: string, password: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider: Uygulama genelinde kimlik doğrulama durumunu (state) yöneten sarmalayıcı bileşen.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa ilk yüklendiğinde yerel depolamadaki kullanıcı bilgisini kontrol et
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  /**
   * login: E-posta ve şifre ile giriş yapar. Token artık çerezlerde otomatik saklanır.
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { user } = response.data.data; // Artık 'token' gelmiyor, sadece 'user'
      
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Giriş başarısız.");
      throw error;
    }
  };

  /**
   * register: Yeni kullanıcı kaydını tamamlar.
   */
  const register = async (data: any) => {
    try {
      const response = await authApi.register(data);
      const { user } = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Kayıt başarısız.");
      throw error;
    }
  };

  /**
   * sendOtp: Telefon numarasına doğrulama kodu gönderir.
   */
  const sendOtp = async (phone: string) => {
    try {
      const response = await authApi.sendOtp(phone);
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Kod gönderilemedi.");
      throw error;
    }
  };

  /**
   * verifyOtp: Gönderilen kodu doğrular.
   */
  const verifyOtp = async (phone: string, code: string): Promise<boolean> => {
    try {
      const response = await authApi.verifyOtp(phone, code);
      if (response.data.success && response.data.data === true) {
        toast.success(response.data.message);
        return true;
      }
      toast.error(response.data.message || "Kod geçersiz.");
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Kod doğrulanamadı.");
      return false;
    }
  };

  /**
   * logout: Backend çerezlerini temizler ve yerel state'i sıfırlar.
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout hatası:", error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      toast.info("Oturum kapatıldı.");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      sendOtp, 
      verifyOtp, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth: Context verilerine kolay erişim sağlayan özel hook.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
