package com.hankabakc.analyzepanel.core.audit.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * AuditLog: Sistemsel işlemlerin denetim günlüğüdür.
 * OWASP 2026: Logging and Monitoring (A09) kapsamında izlenebilirlik sağlar.
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String action; // Yapılan işlem (Örn: LOGIN, REPORT_DELETE)

    @Column(nullable = false)
    private String userEmail; // İşlemi yapan kullanıcı

    @Column(nullable = false)
    private String ipAddress; // İşlemin yapıldığı IP

    @Column(length = 1000)
    private String details; // İşlem detayları (Örn: Rapor ID, Öğrenci ID)

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public AuditLog() {}

    public AuditLog(String action, String userEmail, String ipAddress, String details) {
        this.action = action;
        this.userEmail = userEmail;
        this.ipAddress = ipAddress;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }

    // Getters
    public UUID getId() { return id; }
    public String getAction() { return action; }
    public String getUserEmail() { return userEmail; }
    public String getIpAddress() { return ipAddress; }
    public String getDetails() { return details; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
