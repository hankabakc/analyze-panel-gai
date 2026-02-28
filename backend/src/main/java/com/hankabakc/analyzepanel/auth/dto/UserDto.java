package com.hankabakc.analyzepanel.auth.dto;

import com.hankabakc.analyzepanel.auth.enums.UserRole;
import com.hankabakc.analyzepanel.auth.enums.UserStatus;
import java.util.UUID;

/**
 * UserDto: API üzerinden dış dünyaya açılan güvenli kullanıcı veri modelidir.
 * OWASP 2026: Sensitive Data Exposure (A02) riskini engellemek için Entity sızıntısı önlenir.
 */
public record UserDto(
    UUID id,
    String email,
    String fullName,
    UserRole role,
    UserStatus status
) {}
