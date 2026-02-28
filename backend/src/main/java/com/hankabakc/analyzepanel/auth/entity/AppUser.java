package com.hankabakc.analyzepanel.auth.entity;

import com.hankabakc.analyzepanel.auth.enums.UserRole;
import com.hankabakc.analyzepanel.auth.enums.UserStatus;
import com.hankabakc.analyzepanel.core.security.PiiConverter;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * AppUser: Sistemdeki ana kullanıcı tablosunu temsil eder.
 * OWASP 2026: Hassas veriler (Email, Telefon, Ad) veritabanında şifreli (AES-256) saklanır.
 */
@Entity
@Table(name = "app_users")
public class AppUser {

    @Id
    private UUID id;

    @Convert(converter = PiiConverter.class)
    @Column(unique = true, nullable = false, length = 500)
    private String email;

    @Convert(converter = PiiConverter.class)
    @Column(name = "phone_number", nullable = false, length = 500)
    private String phoneNumber;

    @Convert(converter = PiiConverter.class)
    @Column(name = "full_name", length = 500)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts = 0;

    @Column(name = "lock_time")
    private LocalDateTime lockTime;

    public AppUser() {
    }

    public AppUser(UUID id, String email, String phoneNumber, String fullName, String password, UserRole role, UserStatus status) {
        this.id = id;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.fullName = fullName;
        this.password = password;
        this.role = role;
        this.status = status;
        this.failedLoginAttempts = 0;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }

    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public LocalDateTime getLockTime() { return lockTime; }
    public void setLockTime(LocalDateTime lockTime) { this.lockTime = lockTime; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AppUser appUser = (AppUser) o;
        return Objects.equals(id, appUser.id) && Objects.equals(email, appUser.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, email);
    }

    @Override
    public String toString() {
        return "AppUser{" +
                "id=" + id +
                ", email='" + maskEmail(email) + '\'' +
                ", fullName='" + fullName + '\'' +
                ", role=" + role +
                ", status=" + status +
                '}';
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "****";
        return email.replaceAll("(^[^@]{3}|(?!^)\\G)[^@]", "$1*");
    }
}
