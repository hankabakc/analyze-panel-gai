package com.hankabakc.analyzepanel.auth.service;

import com.hankabakc.analyzepanel.auth.entity.AppUser;
import com.hankabakc.analyzepanel.auth.entity.RefreshToken;
import com.hankabakc.analyzepanel.auth.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * RefreshTokenService: Uzun ömürlü token'ların yaşam döngüsünü yönetir.
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, JwtService jwtService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
    }

    /**
     * createRefreshToken: Kullanıcı için yeni bir oturum oluşturur.
     * OWASP 2026: Eşzamanlı oturum sınırı (3) uygulanır.
     */
    public String createRefreshToken(AppUser user) {
        // 1. Mevcut aktif oturumları kontrol et
        List<RefreshToken> activeSessions = refreshTokenRepository.findAllByUserOrderByExpiryDateAsc(user);
        
        // 2. Eğer 3 veya daha fazla oturum varsa, en eski olanları temizle
        if (activeSessions.size() >= 3) {
            int sessionsToRemove = activeSessions.size() - 2; // Yeniye yer açmak için
            for (int i = 0; i < sessionsToRemove; i++) {
                refreshTokenRepository.delete(activeSessions.get(i));
            }
        }

        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken(
                token,
                user,
                Instant.now().plusMillis(604800000) // 7 Gün
        );

        refreshTokenRepository.save(refreshToken);
        return token;
    }

    /**
     * verifyExpiration: Token'ın süresinin dolup dolmadığını kontrol eder.
     */
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token süresi dolmuş. Lütfen tekrar giriş yapın.");
        }
        return token;
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public int deleteByUserId(AppUser user) {
        return refreshTokenRepository.deleteByUser(user);
    }
}
