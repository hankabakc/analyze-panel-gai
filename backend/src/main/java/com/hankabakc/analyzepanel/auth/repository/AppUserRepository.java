package com.hankabakc.analyzepanel.auth.repository;

import com.hankabakc.analyzepanel.auth.entity.AppUser;
import com.hankabakc.analyzepanel.auth.enums.UserRole;
import com.hankabakc.analyzepanel.auth.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * AppUserRepository: Veritabanı üzerindeki kullanıcı işlemlerini (CRUD) yöneten katmandır.
 */
public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    
    /**
     * E-posta adresi üzerinden kullanıcıyı bulur.
     */
    Optional<AppUser> findByEmail(String email);
    
    /**
     * Telefon numarası üzerinden kullanıcıyı bulur.
     */
    Optional<AppUser> findByPhoneNumber(String phoneNumber);

    /**
     * Belirli bir statüdeki (Örn: PENDING) tüm kullanıcıları listeler.
     */
    List<AppUser> findAllByStatus(UserStatus status);

    /**
     * Belirli bir roldeki ve belirli bir statüdeki kullanıcıları listeler.
     * Eşleştirme merkezinde 'AKTİF' olan 'ÖĞRETMEN' ve 'ÖĞRENCİ'leri ayırmak için kullanılır.
     */
    List<AppUser> findAllByRoleAndStatus(UserRole role, UserStatus status);
}
