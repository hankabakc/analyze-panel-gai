package com.hankabakc.analyzepanel.auth.controller;

import com.hankabakc.analyzepanel.auth.dto.AuthRequest;
import com.hankabakc.analyzepanel.auth.dto.AuthResponse;
import com.hankabakc.analyzepanel.auth.dto.RegisterRequest;
import com.hankabakc.analyzepanel.auth.dto.UserDto;
import com.hankabakc.analyzepanel.auth.dto.VerifyRequest;
import com.hankabakc.analyzepanel.auth.entity.AppUser;
import com.hankabakc.analyzepanel.auth.entity.RefreshToken;
import com.hankabakc.analyzepanel.auth.service.AuthService;
import com.hankabakc.analyzepanel.auth.service.JwtService;
import com.hankabakc.analyzepanel.auth.service.RefreshTokenService;
import com.hankabakc.analyzepanel.core.audit.annotation.AuditAction;
import com.hankabakc.analyzepanel.core.model.ApiResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, RefreshTokenService refreshTokenService, JwtService jwtService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    @AuditAction("LOGIN")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody AuthRequest request, HttpServletResponse response) {
        Map<String, Object> authData = authService.login(request.email(), request.password());
        return handleAuthSuccess(authData, response, "Giriş başarılı.");
    }

    @PostMapping("/register")
    @AuditAction("REGISTER")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        Map<String, Object> authData = authService.register(request);
        return handleAuthSuccess(authData, response, "Kayıt başarılı. Onay bekliyor.");
    }

    @PostMapping("/refresh")
    public ApiResponse<Void> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenStr = jwtService.extractTokenFromCookie(request, "refresh_token");
        
        if (refreshTokenStr == null) throw new RuntimeException("Refresh token bulunamadı.");

        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenStr)
                .map(refreshTokenService::verifyExpiration)
                .orElseThrow(() -> new RuntimeException("Refresh token geçersiz."));

        String newAccessToken = jwtService.generateToken(refreshToken.getUser().getEmail());
        addCookie(response, "access_token", newAccessToken, 900); // 15 dk
        
        return ApiResponse.success(null, "Token yenilendi.");
    }

    @PostMapping("/logout")
    @AuditAction("LOGOUT")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String accessToken = jwtService.extractTokenFromCookie(request, "access_token");
        String refreshToken = jwtService.extractTokenFromCookie(request, "refresh_token");

        authService.logout(accessToken, refreshToken);

        // Çerezleri temizle
        addCookie(response, "access_token", null, 0);
        addCookie(response, "refresh_token", null, 0);
        
        // Tarayıcı hafızasını tamamen imha et (OWASP 2026: Anti-Forensics)
        response.setHeader("Clear-Site-Data", "\"cache\", \"cookies\", \"storage\"");
        
        return ApiResponse.success(null, "Oturum başarıyla kapatıldı.");
    }

    private ApiResponse<AuthResponse> handleAuthSuccess(Map<String, Object> authData, HttpServletResponse response, String message) {
        String accessToken = (String) authData.get("accessToken");
        String refreshToken = (String) authData.get("refreshToken");
        UserDto user = (UserDto) authData.get("user");

        // Çerezleri ekle
        addCookie(response, "access_token", accessToken, 900); // 15 dk
        addCookie(response, "refresh_token", refreshToken, 604800); // 7 gün

        AuthResponse authResponse = new AuthResponse(
            null, // Token artık body'de gitmiyor
            user,
            user.fullName(),
            user.role().name()
        );

        return ApiResponse.success(authResponse, message);
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Yerel geliştirme için false
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
    }

    @PostMapping("/send-otp")
    @AuditAction("SEND_OTP")
    public ApiResponse<Void> sendOtp(@RequestBody VerifyRequest request) {
        authService.sendOtp(request.phoneNumber());
        return ApiResponse.success(null, "Doğrulama kodu gönderildi.");
    }

    @PostMapping("/verify-otp")
    @AuditAction("VERIFY_OTP")
    public ApiResponse<Boolean> verifyOtp(@RequestBody VerifyRequest request) {
        boolean isValid = authService.verifyOtp(request.phoneNumber(), request.code());
        return ApiResponse.success(isValid, "Kod doğrulandı.");
    }
}
