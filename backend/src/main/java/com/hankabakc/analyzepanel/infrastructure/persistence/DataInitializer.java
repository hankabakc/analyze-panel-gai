package com.hankabakc.analyzepanel.infrastructure.persistence;

import com.hankabakc.analyzepanel.auth.entity.AppUser;
import com.hankabakc.analyzepanel.auth.enums.UserRole;
import com.hankabakc.analyzepanel.auth.enums.UserStatus;
import com.hankabakc.analyzepanel.auth.repository.AppUserRepository;
import jakarta.persistence.EntityManager;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final EntityManager entityManager;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${application.security.initial-admin-email}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${application.security.initial-admin-password}")
    private String adminPassword;

    public DataInitializer(AppUserRepository userRepository, EntityManager entityManager, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.entityManager = entityManager;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String adminPhone = "0000000000";

        // Çakışan tüm verileri (email veya phone eşleşen) temizle
        entityManager.createNativeQuery("DELETE FROM app_users WHERE email = :email OR phone_number = :phone")
                .setParameter("email", adminEmail)
                .setParameter("phone", adminPhone)
                .executeUpdate();

        // Temiz veritabanına admini ekle
        AppUser admin = new AppUser(
            UUID.randomUUID(),
            adminEmail,
            adminPhone,
            "Sistem Yöneticisi",
            passwordEncoder.encode(adminPassword),
            UserRole.MANAGER,
            UserStatus.ACTIVE
        );
        
        userRepository.save(admin);
        System.out.println(">> Sistem Yöneticisi Başarıyla Hazırlandı: " + adminEmail);
    }
}
