package com.hankabakc.analyzepanel.auth.service;

import com.hankabakc.analyzepanel.auth.entity.OtpCode;
import com.hankabakc.analyzepanel.auth.repository.OtpCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * OtpService: OTP kodlarının üretim ve gönderim mantığını yönetir.
 * OWASP 2026: Kriptografik rastgelelik için SecureRandom zorunludur.
 */
@Service
public class OtpService {

    private final OtpCodeRepository otpCodeRepository;
    private final SmsService smsService;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(OtpCodeRepository otpCodeRepository, SmsService smsService) {
        this.otpCodeRepository = otpCodeRepository;
        this.smsService = smsService;
    }

    @Transactional
    public void createAndSendOtp(String phoneNumber) {
        // 6 haneli, tahmin edilemez güvenli kod üretimi (100.000 - 999.999 arası)
        int codeInt = 100000 + secureRandom.nextInt(900000);
        String code = String.valueOf(codeInt);
        
        // 5 dakika geçerlilik süresi
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(5);

        OtpCode otpCode = new OtpCode(
            UUID.randomUUID(),
            phoneNumber,
            code,
            expiryDate
        );

        otpCodeRepository.save(otpCode);

        /* Mock SMS servisi üzerinden "gönderim" */
        String message = "ANALYZEPANEL giriş kodunuz: " + code;
        smsService.sendSms(phoneNumber, message);
    }
}
