package com.hankabakc.analyzepanel.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * OtpCode: Telefon doğrulaması için üretilen tek kullanımlık kodları tutar.
 * OWASP 2026: Brute-force koruması için deneme sayısı (attempts) eklenmiştir.
 */
@Entity
@Table(name = "otp_codes")
public class OtpCode {

    @Id
    private UUID id;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Column(name = "is_used")
    private boolean used;

    @Column(name = "attempts", nullable = false)
    private int attempts = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public OtpCode() {}

    public OtpCode(UUID id, String phoneNumber, String code, LocalDateTime expiryDate) {
        this.id = id;
        this.phoneNumber = phoneNumber;
        this.code = code;
        this.expiryDate = expiryDate;
        this.used = false;
        this.attempts = 0;
        this.createdAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public LocalDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
