import api from '../../../lib/api';
import type { ApiResponse, AuthResponse, UserRole } from '../../../lib/types';

/**
 * authService: Kimlik doğrulama süreçleri için kullanılan servis katmanıdır.
 * Backend'deki AuthController uç noktaları ile iletişim kurar.
 */
export const authService = {
  
  /**
   * sendOtp: Girilen telefon numarasına sistem tarafından OTP (Doğrulama Kodu) gönderilmesini sağlar.
   */
  async sendOtp(phoneNumber: string): Promise<ApiResponse<void>> {
    // Backend: /api/v1/auth/send-otp (VerifyRequest bekler)
    const response = await api.post('/auth/send-otp', { phoneNumber });
    return response.data;
  },

  /**
   * verifyOtp: Telefon numarası ve gelen OTP kodunu backend'e göndererek doğrular.
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<ApiResponse<boolean>> {
    // Backend: /api/v1/auth/verify-otp (VerifyRequest bekler)
    const response = await api.post('/auth/verify-otp', { phoneNumber, code });
    return response.data;
  },

  /**
   * register: OTP doğrulaması tamamlanan kullanıcının nihai kayıt işlemini gerçekleştirir.
   * Geriye JWT Token ve kullanıcı bilgilerini döner.
   */
  async register(data: { 
    email: string, 
    phoneNumber: string, 
    fullName: string, 
    password: string, 
    role: UserRole 
  }): Promise<ApiResponse<AuthResponse>> {
    // Backend: /api/v1/auth/register (RegisterRequest bekler)
    const response = await api.post('/auth/register', data);
    return response.data;
  }
};
