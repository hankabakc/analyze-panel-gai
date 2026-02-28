package com.hankabakc.analyzepanel.core.audit.repository;

import com.hankabakc.analyzepanel.core.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import java.time.LocalDateTime;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    @Modifying
    void deleteByTimestampBefore(LocalDateTime timestamp);
}
