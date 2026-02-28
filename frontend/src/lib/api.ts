import axios from 'axios';
import type { ApiResponse, AuthResponse, User } from './types';

/**
 * api: Uygulama genelinde backend ile iletişim kurmak için kullanılan Axios instance'ı.
 * OWASP 2026: withCredentials zorunludur, böylece HttpOnly çerezler otomatik iletilir.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN', // Spring Boot'un gönderdiği çerez adı
  xsrfHeaderName: 'X-XSRF-TOKEN', // Axios'un göndereceği header adı
});

/**
 * Request Interceptor: Artık manuel token eklemeye gerek yok. 
 * Tarayıcı HttpOnly çerezleri otomatik olarak isteğe ekler.
 */
api.interceptors.request.use((config) => {
  return config;
});

/**
 * Response Interceptor: Backend'den gelen cevapları izler. 
 * Eğer 401 (Unauthorized) hatası alınırsa, sessizce token yenilemeyi (refresh) dener.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Eğer hata 401 ise (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post('http://localhost:8081/api/v1/auth/refresh', {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }

    // Eğer hata 403 ise (Forbidden - Yetkisiz Erişim Denemesi)
    if (error.response?.status === 403) {
      console.error("Yetkisiz Erişim Hatası (403):", error.config.url);
      // Kullanıcıyı yetkisiz olduğu bir yere erişmeye çalıştığı için uyaralım.
      // Not: 'toast' burada import edilemezse window.alert veya custom event kullanılabilir.
    }

    return Promise.reject(error);
  }
);

/**
 * authApi: Kimlik doğrulama süreçlerine ait HTTP isteklerini yöneten nesne.
 * Backend'deki AuthController uç noktaları ile doğrudan eşleşir.
 */
export const authApi = {
  // Telefon numarasına OTP gönderimi
  sendOtp: (phoneNumber: string) => 
    api.post<ApiResponse<void>>('/auth/send-otp', { phoneNumber }),
    
  // OTP kodunun doğrulanması (Geriye Boolean döner)
  verifyOtp: (phoneNumber: string, code: string) => 
    api.post<ApiResponse<boolean>>('/auth/verify-otp', { phoneNumber, code }),

  // E-posta ve şifre ile giriş
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),
    
  // Yeni kullanıcı kaydı
  register: (data: any) => 
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),
};

/**
 * membershipApi: Üyelik yönetimi, kullanıcı onayları ve hiyerarşik eşleşme 
 * işlemlerini yöneten API nesnesidir. Sadece MANAGER rolü için yetkilendirilmiştir.
 */
export const membershipApi = {
  // Onay bekleyen kullanıcıların listesini getirir
  getPendingUsers: () => 
    api.get<ApiResponse<User[]>>('/membership/pending'),

  // Sistemdeki tüm aktif (onaylanmış) öğretmenleri getirir
  getTeachers: () => 
    api.get<ApiResponse<User[]>>('/membership/teachers'),

  // Sistemdeki tüm aktif (onaylanmış) öğrencileri getirir
  getStudents: () => 
    api.get<ApiResponse<User[]>>('/membership/students'),

  // Belirli bir kullanıcıyı onaylayarak ACTIVE statüsüne çeker
  approveUser: (userId: string) => 
    api.post<ApiResponse<void>>(`/membership/approve/${userId}`),

  // Belirli bir kullanıcıyı reddederek REJECTED statüsüne çeker
  rejectUser: (userId: string) => 
    api.post<ApiResponse<void>>(`/membership/reject/${userId}`),

  // Bir öğrenciyi bir öğretmenle eşleştirir
  pairStudentTeacher: (studentId: string, teacherId: string) => 
    api.post<ApiResponse<void>>('/membership/pair', { studentId, teacherId }),

  // Giriş yapan öğretmenin kendi öğrencilerini getirir
  getMyStudents: () => 
    api.get<ApiResponse<User[]>>('/membership/my-students'),

  // Giriş yapan öğrencinin kendi öğretmenlerini getirir
  getMyTeachers: () => 
    api.get<ApiResponse<User[]>>('/membership/my-teachers'),
};

/**
 * analysisApi: PDF yükleme, AI analiz raporlarını listeleme ve 
 * rapor detaylarını (grafik verileri dahil) getiren API nesnesidir.
 */
export const analysisApi = {
  // PDF dosyasını yükler ve analiz sürecini başlatır
  uploadPdf: (studentId: string, examCount: number, reportType: string, file: File) => {
    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('examCount', examCount.toString());
    formData.append('reportType', reportType);
    formData.append('file', file);
    return api.post<ApiResponse<string>>('/analysis/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Bir öğrenciye ait tüm analiz raporlarını listeler
  getStudentReports: (studentId: string) => 
    api.get<ApiResponse<any[]>>(`/analysis/reports/${studentId}`),

  // Seçilen bir raporun tüm grafik ve AI detaylarını getirir
  getAnalysisDetail: (reportId: string, cumulative: boolean = false) => 
    api.get<ApiResponse<any>>(`/analysis/details/${reportId}?cumulative=${cumulative}`),

  // Bekleyen analizi onaylar ve öğrenciye gönderir
  approveReport: (reportId: string) => 
    api.post<ApiResponse<void>>(`/analysis/approve/${reportId}`),

  // Bekleyen analizi reddeder
  rejectReport: (reportId: string) => 
    api.post<ApiResponse<void>>(`/analysis/reject/${reportId}`),

  // Raporu tamamen siler
  deleteReport: (reportId: string) => 
    api.delete<ApiResponse<void>>(`/analysis/${reportId}`),

  // OKUL VE PROFİL İŞLEMLERİ
  searchSchools: (query: string) => 
    api.get<ApiResponse<any[]>>(`/analysis/schools/search?query=${query}`),

  getProfile: () => 
    api.get<ApiResponse<any>>('/analysis/profile'),

  updateProfile: (schoolId?: string, manualScore?: number) => {
    const params = new URLSearchParams();
    if (schoolId) params.append('schoolId', schoolId);
    if (manualScore) params.append('manualScore', manualScore.toString());
    return api.post<ApiResponse<void>>(`/analysis/profile?${params.toString()}`);
  },

  getGlobalSummary: (studentId: string) => 
    api.post<ApiResponse<string>>(`/analysis/global-summary/${studentId}`),

  getCumulativeProfile: (studentId: string) => 
    api.get<ApiResponse<any>>(`/analysis/profile/cumulative/${studentId}`),

  mergeCumulative: (studentId: string) => 
    api.post<ApiResponse<string>>(`/analysis/merge-cumulative/${studentId}`)
};

export default api;
