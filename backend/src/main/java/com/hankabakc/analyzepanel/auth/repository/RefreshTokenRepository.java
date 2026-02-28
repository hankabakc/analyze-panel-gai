package com.hankabakc.analyzepanel.auth.repository;

import com.hankabakc.analyzepanel.auth.entity.AppUser;
import com.hankabakc.analyzepanel.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findAllByUserOrderByExpiryDateAsc(AppUser user);
    
    @Modifying
    void deleteByExpiryDateBefore(java.time.Instant now);

    @Modifying
    int deleteByUser(AppUser user);
}
