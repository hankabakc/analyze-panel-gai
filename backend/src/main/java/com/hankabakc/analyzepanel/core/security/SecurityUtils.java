package com.hankabakc.analyzepanel.core.security;

import com.hankabakc.analyzepanel.auth.entity.AppUser;
import com.hankabakc.analyzepanel.auth.repository.AppUserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * SecurityUtils: Mevcut oturumdaki kullanıcı bilgilerine erişim sağlayan yardımcı sınıftır.
 * IDOR koruması için her istekte "Bu veri bu kullanıcıya mı ait?" kontrolü burada başlar.
 */
@Component
public class SecurityUtils {

    private final AppUserRepository userRepository;

    public SecurityUtils(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * getCurrentUserEmail: Oturumdaki kullanıcının e-posta adresini döner.
     */
    public String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return authentication.getName();
    }

    /**
     * getCurrentUser: Oturumdaki kullanıcıyı veritabanından yükleyerek döner.
     */
    public AppUser getCurrentUser() {
        String email = getCurrentUserEmail();
        if (email == null) return null;
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Oturumdaki kullanıcı bulunamadı."));
    }

    /**
     * isUserAuthorized: Veri sahipliğini kontrol eder.
     * @param ownerId Verinin sahibi olan kullanıcı ID'si
     * @return Mevcut kullanıcı bu veriye erişebilir mi?
     */
    public boolean isUserAuthorized(UUID ownerId) {
        AppUser currentUser = getCurrentUser();
        if (currentUser == null) return false;

        // MANAGER her şeyi görebilir
        if (currentUser.getRole().name().equals("ROLE_MANAGER")) {
            return true;
        }

        // Kullanıcı kendi verisine erişebilir
        return currentUser.getId().equals(ownerId);
    }
}
