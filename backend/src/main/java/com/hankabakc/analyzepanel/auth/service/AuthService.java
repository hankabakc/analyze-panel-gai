package com.hankabakc.analyzepanel.auth.service;

import com.hankabakc.analyzepanel.auth.dto.AuthResponse;
import com.hankabakc.analyzepanel.auth.dto.RegisterRequest;
import com.hankabakc.analyzepanel.auth.dto.UserDto;
import com.hankabakc.analyzepanel.auth.entity.AppUser;
import com.hankabakc.analyzepanel.auth.enums.UserStatus;
import com.hankabakc.analyzepanel.auth.repository.AppUserRepository;
import com.hankabakc.analyzepanel.auth.repository.OtpCodeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * AuthService: Kimlik doğrulama, kayıt ve OTP süreçlerini yöneten servis sınıfıdır.
 * Tüm işlemler veritabanı tutarlılığı için @Transactional ile işaretlenmiştir.
 */
@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final com.hankabakc.analyzepanel.auth.repository.BlacklistedTokenRepository blacklistedTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AppUserRepository userRepository, OtpCodeRepository otpCodeRepository, 
                       OtpService otpService, JwtService jwtService, 
                       RefreshTokenService refreshTokenService,
                       com.hankabakc.analyzepanel.auth.repository.BlacklistedTokenRepository blacklistedTokenRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.otpCodeRepository = otpCodeRepository;
        this.otpService = otpService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.blacklistedTokenRepository = blacklistedTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * logout: Kullanıcının oturumunu tam güvenli olarak kapatır.
     * 1. Refresh token'ı siler.
     * 2. Mevcut Access token'ı kara listeye alır.
     */
    @Transactional
    public void logout(String accessToken, String refreshToken) {
        // 1. Refresh token'ı veritabanından temizle
        if (refreshToken != null) {
            refreshTokenService.findByToken(refreshToken).ifPresent(token -> {
                refreshTokenService.deleteByUserId(token.getUser());
            });
        }

        // 2. Access token'ı kara listeye al
        if (accessToken != null) {
            try {
                LocalDateTime expiry = jwtService.extractExpirationDateTime(accessToken);
                blacklistedTokenRepository.save(new com.hankabakc.analyzepanel.auth.entity.BlacklistedToken(accessToken, expiry));
            } catch (Exception e) {
                // Token zaten geçersizse veya parse edilemiyorsa işlem yapmaya gerek yok
            }
        }
    }

    /**
     * sendOtp: Kullanıcının telefon numarasına doğrulama kodu gönderir.
     * OWASP 2026: Spam ve kaynak tüketimi saldırılarına karşı 60 sn cooldown uygular.
     */
    public void sendOtp(String phoneNumber) {
        if (userRepository.findByPhoneNumber(phoneNumber).isPresent()) {
            throw new RuntimeException("Bu telefon numarası zaten sisteme kayıtlı. Lütfen giriş yapın.");
        }

        // Son 60 saniyede gönderilmiş aktif bir kod var mı kontrol et
        otpCodeRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc(phoneNumber).ifPresent(lastOtp -> {
            if (lastOtp.getCreatedAt().plusSeconds(60).isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Yeni bir kod istemek için lütfen 60 saniye bekleyin.");
            }
        });

        otpService.createAndSendOtp(phoneNumber);
    }

    /**
     * verifyOtp: Kullanıcının girdiği OTP kodunu doğrular.
     * OWASP 2026: Brute-force saldırılarına karşı deneme sınırı (3) uygulanır.
     */
    @Transactional
    public boolean verifyOtp(String phoneNumber, String code) {
        var otp = otpCodeRepository.findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc(phoneNumber)
                .orElseThrow(() -> new RuntimeException("Geçerli bir kod bulunamadı."));

        if (otp.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Kodun süresi dolmuş.");
        }

        // Girilen kodun doğruluğu
        if (!otp.getCode().equals(code)) {
            int currentAttempts = otp.getAttempts() + 1;
            otp.setAttempts(currentAttempts);
            
            if (currentAttempts >= 3) {
                otp.setUsed(true); // Çok fazla hatalı deneme, kodu iptal et
                otpCodeRepository.save(otp);
                throw new RuntimeException("Çok fazla hatalı deneme yaptınız. Lütfen yeni bir kod isteyin.");
            }
            
            otpCodeRepository.save(otp);
            throw new RuntimeException("Hatalı kod girdiniz. Kalan hakkınız: " + (3 - currentAttempts));
        }

        // Kod doğruysa kullanıldı olarak işaretle
        otp.setUsed(true);
        otpCodeRepository.save(otp);
        return true;
    }

    /**
     * login: E-posta ve şifre ile sisteme giriş yapar.
     * OWASP 2026: Brute-force saldırılarına karşı hesap kilitleme mekanizması içerir.
     */
    @Transactional
    public Map<String, Object> login(String email, String password) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("E-posta veya şifre hatalı."));

        // 1. Hesap Kilidi Kontrolü
        if (user.getLockTime() != null) {
            if (user.getLockTime().plusMinutes(15).isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Çok fazla hatalı deneme. Hesabınız geçici olarak kilitlendi. Lütfen 15 dakika sonra tekrar deneyin.");
            } else {
                // Kilit süresi dolmuş, temizle
                user.setLockTime(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
        }

        boolean passwordMatches = passwordEncoder.matches(password, user.getPassword());

        if (!passwordMatches) {
            // 2. Hatalı Deneme Kaydı
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            
            if (attempts >= 5) {
                user.setLockTime(LocalDateTime.now());
                userRepository.save(user);
                throw new RuntimeException("Hatalı deneme sınırı aşıldı. Hesabınız 15 dakika süreyle kilitlendi.");
            }
            
            userRepository.save(user);
            throw new RuntimeException("Hatalı e-posta veya şifre. Kalan hak: " + (5 - attempts));
        }

        // 3. Başarılı Giriş: Denemeleri Sıfırla
        user.setFailedLoginAttempts(0);
        user.setLockTime(null);
        userRepository.save(user);

        // Token üretim süreci
        String accessToken = jwtService.generateToken(user.getEmail());
        String refreshToken = refreshTokenService.createRefreshToken(user);

        // Entity sızıntısını engellemek için DTO'ya map et
        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getStatus());

        return Map.of(
            "accessToken", accessToken,
            "refreshToken", refreshToken,
            "user", userDto
        );
    }

    /**
     * register: Yeni bir kullanıcı kaydı oluşturur.
     */
    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new RuntimeException("Bu e-posta adresi zaten kullanılıyor.");
        }

        AppUser user = new AppUser(
            UUID.randomUUID(),
            request.email(),
            request.phoneNumber(),
            request.fullName(),
            passwordEncoder.encode(request.password()),
            request.role(),
            UserStatus.PENDING
        );

        userRepository.save(user);

        String accessToken = jwtService.generateToken(user.getEmail());
        String refreshToken = refreshTokenService.createRefreshToken(user);

        // Entity sızıntısını engellemek için DTO'ya map et
        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getStatus());

        return Map.of(
            "accessToken", accessToken,
            "refreshToken", refreshToken,
            "user", userDto
        );
    }
}
