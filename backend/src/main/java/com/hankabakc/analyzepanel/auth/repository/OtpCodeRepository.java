package com.hankabakc.analyzepanel.auth.repository;

import com.hankabakc.analyzepanel.auth.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface OtpCodeRepository extends JpaRepository<OtpCode, UUID> {
    Optional<OtpCode> findTopByPhoneNumberAndUsedFalseOrderByCreatedAtDesc(String phoneNumber);
}
