package com.hankabakc.analyzepanel.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthRequest(
    @NotBlank(message = "E-posta adresi boş bırakılamaz")
    @Email(message = "Geçerli bir e-posta adresi giriniz")
    String email, 
    
    @NotBlank(message = "Şifre boş bırakılamaz")
    String password
) {}
