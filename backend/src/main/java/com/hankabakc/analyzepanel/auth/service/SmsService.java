package com.hankabakc.analyzepanel.auth.service;

/* 
   SMS gönderimi için ortak arayüz.
   Tak-çıkar (Plug-and-play) mimari sağlar.
*/
public interface SmsService {
    void sendSms(String phoneNumber, String message);
}
