package com.hankabakc.analyzepanel.analysis.controller;

import com.hankabakc.analyzepanel.analysis.dto.AnalysisResponse;
import com.hankabakc.analyzepanel.analysis.entity.AnalysisReport;
import com.hankabakc.analyzepanel.analysis.entity.ReferenceSchool;
import com.hankabakc.analyzepanel.analysis.entity.StudentProfile;
import com.hankabakc.analyzepanel.analysis.service.AnalysisService;
import com.hankabakc.analyzepanel.core.audit.annotation.AuditAction;
import com.hankabakc.analyzepanel.core.model.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analysis")
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/upload")
    @AuditAction("PDF_UPLOAD")
    public ApiResponse<UUID> uploadPdf(
            @RequestParam("studentId") UUID studentId,
            @RequestParam("examCount") Integer examCount,
            @RequestParam(value = "reportType", defaultValue = "SINGLE") String reportType,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(analysisService.uploadAndProcess(studentId, file, examCount, reportType), "Başlatıldı.");
    }

    @DeleteMapping("/{reportId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'MANAGER')")
    @AuditAction("REPORT_DELETE")
    public ApiResponse<Void> deleteReport(@PathVariable UUID reportId) {
        analysisService.removeReport(reportId);
        return ApiResponse.success(null, "Silindi.");
    }

    @GetMapping("/details/{reportId}")
    public ApiResponse<AnalysisResponse> getAnalysisDetail(
            @PathVariable UUID reportId,
            @RequestParam(value = "cumulative", defaultValue = "false") boolean cumulative) {
        return ApiResponse.success(analysisService.getAnalysisDetail(reportId, cumulative), "Getirildi.");
    }

    @PostMapping("/approve/{reportId}")
    @AuditAction("REPORT_APPROVE")
    public ApiResponse<Void> approveReport(@PathVariable UUID reportId) {
        analysisService.approveReport(reportId);
        return ApiResponse.success(null, "Onaylandı.");
    }

    @PostMapping("/reject/{reportId}")
    @AuditAction("REPORT_REJECT")
    public ApiResponse<Void> rejectReport(@PathVariable UUID reportId) {
        analysisService.rejectReport(reportId);
        return ApiResponse.success(null, "Reddedildi.");
    }

    @GetMapping("/reports/{studentId}")
    public ApiResponse<List<AnalysisReport>> getReports(
            @PathVariable UUID studentId,
            @RequestAttribute("userId") String requestUserId,
            @RequestAttribute("role") String role) {
        
        // Kendi raporlarını isteyen öğrenci
        if (studentId.toString().equals(requestUserId)) {
            return ApiResponse.success(analysisService.getStudentReportsForStudent(studentId), "Raporlar listelendi.");
        } 
        
        // Başka birinin raporunu isteyen ancak öğretmen veya yönetici olmayan (YETKİSİZ ERİŞİM DENEMESİ)
        if (!"TEACHER".equals(role) && !"MANAGER".equals(role)) {
            throw new RuntimeException("Bu işlem için yetkiniz bulunmamaktadır.");
        }

        // Yetkili personel (Öğretmen veya Müdür) için raporları getir
        return ApiResponse.success(analysisService.getStudentReportsForTeacher(studentId), "Öğrenci raporları listelendi.");
    }

    @GetMapping("/schools/search")
    public ApiResponse<List<ReferenceSchool>> searchSchools(@RequestParam("query") String query) {
        return ApiResponse.success(analysisService.searchSchools(query), "Okullar listelendi.");
    }

    @GetMapping("/profile")
    public ApiResponse<StudentProfile> getProfile(@RequestAttribute("userId") String userId) {
        return ApiResponse.success(analysisService.getStudentProfile(UUID.fromString(userId)), "Profil getirildi.");
    }

    @PostMapping("/profile")
    public ApiResponse<Void> updateProfile(
            @RequestAttribute("userId") String userId,
            @RequestParam(value = "schoolId", required = false) UUID schoolId,
            @RequestParam(value = "manualScore", required = false) java.math.BigDecimal manualScore) {
        analysisService.updateStudentProfile(UUID.fromString(userId), schoolId, manualScore);
        return ApiResponse.success(null, "Hedef güncellendi.");
    }

    @GetMapping("/profile/cumulative/{studentId}")
    public ApiResponse<AnalysisResponse> getCumulativeProfile(@PathVariable UUID studentId) {
        return ApiResponse.success(analysisService.getStudentCumulativeProfile(studentId), "Kümülatif profil getirildi.");
    }

    @PostMapping("/merge-cumulative/{studentId}")
    public ApiResponse<String> mergeCumulative(@PathVariable UUID studentId) {
        return ApiResponse.success(analysisService.mergeReportsToCumulative(studentId), "Raporlar harmanlandı.");
    }

    @PostMapping("/global-summary/{studentId}")
    public ApiResponse<String> getGlobalSummary(@PathVariable UUID studentId) {
        return ApiResponse.success(analysisService.generateGlobalStrategicSummary(studentId), "Global özet oluşturuldu.");
    }
}
