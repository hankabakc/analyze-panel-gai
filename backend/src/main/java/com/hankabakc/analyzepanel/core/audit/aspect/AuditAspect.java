package com.hankabakc.analyzepanel.core.audit.aspect;

import com.hankabakc.analyzepanel.core.audit.annotation.AuditAction;
import com.hankabakc.analyzepanel.core.audit.entity.AuditLog;
import com.hankabakc.analyzepanel.core.audit.repository.AuditLogRepository;
import com.hankabakc.analyzepanel.core.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * AuditAspect: @AuditAction anotasyonunu izler ve otomatik günlük kaydı tutar.
 */
@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final SecurityUtils securityUtils;

    public AuditAspect(AuditLogRepository auditLogRepository, SecurityUtils securityUtils) {
        this.auditLogRepository = auditLogRepository;
        this.securityUtils = securityUtils;
    }

    @AfterReturning(pointcut = "@annotation(auditAction)", returning = "result")
    public void logAction(JoinPoint joinPoint, AuditAction auditAction, Object result) {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        
        String userEmail = securityUtils.getCurrentUserEmail();
        if (userEmail == null) userEmail = "ANONYMOUS";
        
        String ipAddress = request.getRemoteAddr();
        String action = auditAction.value();
        
        // İşlem detaylarını argümanlardan alalım
        StringBuilder details = new StringBuilder();
        Object[] args = joinPoint.getArgs();
        if (args != null && args.length > 0) {
            for (Object arg : args) {
                if (arg != null) details.append(arg.toString()).append(" ");
            }
        }

        AuditLog log = new AuditLog(action, userEmail, ipAddress, sanitizeForLog(details.toString().trim()));
        auditLogRepository.save(log);
    }

    /**
     * sanitizeForLog: Log Forging saldırılarını engellemek için yeni satır karakterlerini temizler.
     */
    private String sanitizeForLog(String input) {
        if (input == null) return "";
        return input.replace("\n", "[NL]").replace("\r", "[CR]");
    }
}
