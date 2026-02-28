package com.hankabakc.analyzepanel.auth.dto;

import com.hankabakc.analyzepanel.auth.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "E-posta adresi boş bırakılamaz")
    @Email(message = "Geçerli bir e-posta adresi giriniz")
    String email,

    @NotBlank(message = "Telefon numarası boş bırakılamaz")
    @Size(min = 10, max = 15, message = "Geçerli bir telefon numarası giriniz")
    String phoneNumber, 

    @NotBlank(message = "Ad soyad boş bırakılamaz")
    String fullName, 

    @NotBlank(message = "Şifre boş bırakılamaz")
    @jakarta.validation.constraints.Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Şifre en az 8 karakter olmalı, en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir"
    )
    String password, 

    @NotNull(message = "Rol seçimi zorunludur")
    UserRole role
) {}
