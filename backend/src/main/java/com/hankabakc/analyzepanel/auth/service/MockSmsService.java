package com.hankabakc.analyzepanel.auth.service;

import org.springframework.stereotype.Service;

/* 
   Geliştirme aşamasında SMS maliyetini sıfırlayan simülasyon servisi.
   Mesajları telefon yerine uygulama loglarına yazdırır.
*/
@Service
public class MockSmsService implements SmsService {

    @Override
    public void sendSms(String phoneNumber, String message) {
        System.out.println("---------------------------------------");
        System.out.println("[SMS SİMÜLASYONU]");
        System.out.println("ALICI: " + phoneNumber);
        System.out.println("MESAJ: " + message);
        System.out.println("---------------------------------------");
    }
}
