package com.hankabakc.analyzepanel.analysis.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hankabakc.analyzepanel.analysis.dto.AnalysisResponse;
import com.hankabakc.analyzepanel.analysis.entity.*;
import com.hankabakc.analyzepanel.analysis.repository.*;
import com.hankabakc.analyzepanel.infrastructure.storage.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * AnalysisService: Analiz raporlarının yönetimini, dosya yükleme süreçlerini
 * ve öğrenci profil hedeflerini koordine eden servis katmanıdır.
 */
@Service
public class AnalysisService {

    private final AnalysisReportRepository reportRepository;
    private final LessonAnalysisRepository lessonRepository;
    private final TopicDetailRepository topicRepository;
    private final AiGlobalFeedbackRepository feedbackRepository;
    private final StudentProfileRepository profileRepository;
    private final ReferenceSchoolRepository schoolRepository;
    private final StorageService storageService;
    private final GeminiAiService geminiAiService;
    private final ObjectMapper objectMapper;
    private final jakarta.persistence.EntityManager entityManager;
    private final TransactionTemplate transactionTemplate;
    private final com.hankabakc.analyzepanel.core.security.SecurityUtils securityUtils;
    private final com.hankabakc.analyzepanel.membership.service.MembershipService membershipService;

    public AnalysisService(AnalysisReportRepository reportRepository, 
                           LessonAnalysisRepository lessonRepository,
                           TopicDetailRepository topicRepository,
                           AiGlobalFeedbackRepository feedbackRepository,
                           StudentProfileRepository profileRepository,
                           ReferenceSchoolRepository schoolRepository,
                           StorageService storageService,
                           GeminiAiService geminiAiService,
                           ObjectMapper objectMapper,
                           jakarta.persistence.EntityManager entityManager,
                           TransactionTemplate transactionTemplate,
                           com.hankabakc.analyzepanel.core.security.SecurityUtils securityUtils,
                           com.hankabakc.analyzepanel.membership.service.MembershipService membershipService) {
        this.reportRepository = reportRepository;
        this.lessonRepository = lessonRepository;
        this.topicRepository = topicRepository;
        this.feedbackRepository = feedbackRepository;
        this.profileRepository = profileRepository;
        this.schoolRepository = schoolRepository;
        this.storageService = storageService;
        this.geminiAiService = geminiAiService;
        this.objectMapper = objectMapper;
        this.entityManager = entityManager;
        this.transactionTemplate = transactionTemplate;
        this.securityUtils = securityUtils;
        this.membershipService = membershipService;
    }

    /**
     * validateAccess: IDOR/BOLA koruması için merkezi yetki kontrolü.
     */
    private void validateAccess(UUID targetStudentId) {
        var currentUser = securityUtils.getCurrentUser();
        if (currentUser.getRole().name().equals("ROLE_MANAGER")) return;
        
        if (currentUser.getRole().name().equals("ROLE_TEACHER")) {
            if (!membershipService.isTeacherOfStudent(currentUser.getId(), targetStudentId)) {
                throw new RuntimeException("Bu öğrencinin verilerine erişim yetkiniz yok.");
            }
            return;
        }

        if (currentUser.getRole().name().equals("ROLE_STUDENT")) {
            if (!currentUser.getId().equals(targetStudentId)) {
                throw new RuntimeException("Sadece kendi verilerinize erişebilirsiniz.");
            }
        }
    }

    @Transactional
    public UUID uploadAndProcess(UUID studentId, MultipartFile file, Integer examCount, String reportType) {
        validateAccess(studentId); // IDOR Kontrolü
        
        String fileName = storageService.store(file);
        // ... geri kalan kod aynı ...

        AnalysisReport report = new AnalysisReport(
            UUID.randomUUID(),
            studentId,
            fileName,
            "Analiz Ediliyor...",
            examCount
        );
        report.setReportType(reportType);
        reportRepository.save(report);

        String history = getStudentHistory(studentId);

        Thread.ofVirtual().start(() -> {
            try {
                String aiJsonResponse = geminiAiService.analyzeReportPdf(file, examCount, reportType, history);
                AnalysisResponse aiData = objectMapper.readValue(aiJsonResponse, AnalysisResponse.class);
                String validationErrors = validateAiData(aiData);
                
                transactionTemplate.execute(status -> {
                    saveAnalysisData(report.getId(), aiData, aiJsonResponse, validationErrors);
                    return null;
                });
            } catch (Exception e) {
                transactionTemplate.execute(status -> {
                    report.setExamTitle("Analiz Başarısız: " + e.getMessage());
                    reportRepository.save(report);
                    return null;
                });
            }
        });

        return report.getId();
    }

    @Transactional
    public void removeReport(UUID reportId) {
        reportRepository.deleteById(reportId);
    }

    private String getStudentHistory(UUID studentId) {
        List<AnalysisReport> lastReports = reportRepository.findAllByStudentIdOrderByProcessedAtDesc(studentId)
                .stream().limit(5).toList();
        if (lastReports.isEmpty()) return "Henüz geçmiş veri yok.";
        StringBuilder sb = new StringBuilder();
        for (var r : lastReports) {
            sb.append(String.format("[%s: %s], ", r.getProcessedAt(), r.getExamTitle()));
        }
        return sb.toString();
    }

    @Transactional
    protected void saveAnalysisData(UUID reportId, AnalysisResponse data, String rawResponse, String validationErrors) {
        AnalysisReport report = reportRepository.findById(reportId).orElseThrow();
        report.setExamTitle(data.examTitle());
        report.setRawAiResponse(rawResponse);
        report.setValidationErrors(validationErrors);
        report.setReportType(data.reportType());
        report.setIntendedExamCount(data.intendedExamCount());
        report.setMentorFeedback(data.mentorFeedback());
        report.setFutureProjection(data.futureProjection());
        report.setStrategicPriority(data.strategicPriority());
        report.setTeacherActionPlan(data.teacherActionPlan());
        reportRepository.save(report);

        if (data.examList() != null) {
            for (var exam : data.examList()) {
                entityManager.createNativeQuery(
                    "INSERT INTO exam_summaries (id, report_id, exam_name, exam_date, total_score) VALUES (:id, :rid, :name, :date, :score)")
                    .setParameter("id", UUID.randomUUID()).setParameter("rid", reportId)
                    .setParameter("name", exam.examName()).setParameter("date", exam.examDate()).setParameter("score", exam.totalScore()).executeUpdate();
            }
        }

        if (data.consolidatedResult() != null && data.consolidatedResult().lessons() != null) {
            for (var lessonDto : data.consolidatedResult().lessons()) {
                LessonAnalysis lesson = new LessonAnalysis(UUID.randomUUID(), reportId, lessonDto.lessonName(), lessonDto.correct(), lessonDto.wrong(), lessonDto.empty(), lessonDto.successRate());
                lessonRepository.save(lesson);
                if (lessonDto.topics() != null) {
                    for (var topicDto : lessonDto.topics()) {
                        TopicDetail topic = new TopicDetail(UUID.randomUUID(), lesson.getId(), topicDto.topicName(), topicDto.status(), topicDto.aiSuggestion(), topicDto.totalQuestions(), topicDto.correctCount(), topicDto.wrongCount());
                        topicRepository.save(topic);
                    }
                }
            }
        }

        AiGlobalFeedback feedback = new AiGlobalFeedback(UUID.randomUUID(), reportId, data.globalFeedback());
        feedbackRepository.save(feedback);
    }

    private String validateAiData(AnalysisResponse data) {
        StringBuilder errors = new StringBuilder();
        if (data.consolidatedResult() != null && data.consolidatedResult().lessons() != null) {
            for (var lesson : data.consolidatedResult().lessons()) {
                int totalCalculated = (lesson.correct() != null ? lesson.correct() : 0) + (lesson.wrong() != null ? lesson.wrong() : 0) + (lesson.empty() != null ? lesson.empty() : 0);
                if (totalCalculated == 0) errors.append(String.format("[%s] Soru sayısı 0. ", lesson.lessonName()));
            }
        }
        return errors.toString().trim();
    }

    public List<ReferenceSchool> searchSchools(String query) {
        return schoolRepository.searchSchools(query);
    }

    public StudentProfile getStudentProfile(UUID userId) {
        return profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(new StudentProfile(UUID.randomUUID(), userId)));
    }

    @Transactional
    public void updateStudentProfile(UUID userId, UUID schoolId, java.math.BigDecimal manualScore) {
        StudentProfile profile = getStudentProfile(userId);
        profile.setTargetSchoolId(schoolId);
        profile.setTargetScore(manualScore);
        profile.setLastUpdatedAt(java.time.LocalDateTime.now());
        profileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public List<AnalysisReport> getStudentReports(UUID studentId) { return reportRepository.findAllByStudentIdOrderByProcessedAtDesc(studentId); }

    @Transactional(readOnly = true)
    public List<AnalysisReport> getStudentReportsForTeacher(UUID studentId) { return reportRepository.findAllByStudentIdOrderByProcessedAtDesc(studentId); }

    @Transactional(readOnly = true)
    public List<AnalysisReport> getStudentReportsForStudent(UUID studentId) { 
        return reportRepository.findAllByStudentIdOrderByProcessedAtDesc(studentId).stream()
                .filter(r -> "APPROVED".equals(r.getStatus())).toList(); 
    }

    @Transactional
    public String mergeReportsToCumulative(UUID studentId) {
        validateAccess(studentId); // IDOR Kontrolü
        List<AnalysisReport> pendingReports = reportRepository.findAllByStudentIdOrderByProcessedAtDesc(studentId)
                .stream().filter(r -> "APPROVED".equals(r.getStatus()) && "NOT_INCLUDED".equals(r.getCumulativeStatus())).toList();
        if (pendingReports.isEmpty()) return generateGlobalStrategicSummary(studentId);
        for (var report : pendingReports) {
            report.setCumulativeStatus("INCLUDED");
            reportRepository.save(report);
        }
        return generateGlobalStrategicSummary(studentId);
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getStudentCumulativeProfile(UUID studentId) {
        validateAccess(studentId); // IDOR Kontrolü
        List<Object[]> allExamsRows = entityManager.createNativeQuery(
            "SELECT es.exam_name, es.exam_date, es.total_score FROM exam_summaries es " +
            "JOIN analysis_reports ar ON es.report_id = ar.id WHERE ar.student_id = :sid ORDER BY es.exam_date ASC")
            .setParameter("sid", studentId).getResultList();

        List<AnalysisResponse.ExamSummaryDto> examList = allExamsRows.stream()
            .map(row -> new AnalysisResponse.ExamSummaryDto((String) row[0], (String) row[1], (java.math.BigDecimal) row[2])).toList();

        List<String> lessonNames = entityManager.createNativeQuery(
            "SELECT DISTINCT la.lesson_name FROM lesson_analyses la JOIN analysis_reports ar ON la.report_id = ar.id WHERE ar.student_id = :sid")
            .setParameter("sid", studentId).getResultList();

        List<AnalysisResponse.LessonDto> lessonDtos = lessonNames.stream().map(lname -> {
            Object[] stats = (Object[]) entityManager.createNativeQuery(
                "SELECT SUM(la.correct_count), SUM(la.wrong_count), SUM(la.empty_count), AVG(la.success_rate) " +
                "FROM lesson_analyses la JOIN analysis_reports ar ON la.report_id = ar.id " +
                "WHERE ar.student_id = :sid AND la.lesson_name = :lname AND ar.status = 'APPROVED'")
                .setParameter("sid", studentId).setParameter("lname", lname).getSingleResult();

            return new AnalysisResponse.LessonDto(UUID.randomUUID(), lname, 
                stats[0] != null ? ((Number) stats[0]).intValue() : 0, 
                stats[1] != null ? ((Number) stats[1]).intValue() : 0, 
                stats[2] != null ? ((Number) stats[2]).intValue() : 0, 
                stats[3] != null ? java.math.BigDecimal.valueOf(((Number) stats[3]).doubleValue()) : java.math.BigDecimal.ZERO, 
                List.of());
        }).toList();

        StudentProfile profile = profileRepository.findByUserId(studentId).orElse(null);
        String targetName = null; java.math.BigDecimal targetScore = null;
        if (profile != null && profile.getTargetSchoolId() != null) {
            ReferenceSchool school = schoolRepository.findById(profile.getTargetSchoolId()).orElse(null);
            if (school != null) { targetName = school.getSchoolName(); targetScore = school.getBaseScore(); }
        }

        // 4. KONU BAZLI TREND ANALİZİ (KRONİK MOTORU)
        List<Object[]> topicRows = entityManager.createNativeQuery(
            "SELECT la.lesson_name, td.topic_name, td.status, ar.processed_at " +
            "FROM topic_details td " +
            "JOIN lesson_analyses la ON td.lesson_analysis_id = la.id " +
            "JOIN analysis_reports ar ON la.report_id = ar.id " +
            "WHERE ar.student_id = :sid AND ar.status = 'APPROVED' " +
            "ORDER BY td.topic_name, ar.processed_at ASC")
            .setParameter("sid", studentId).getResultList();

        java.util.Map<String, List<String>> topicMap = new java.util.HashMap<>();
        java.util.Map<String, String> topicToLesson = new java.util.HashMap<>();

        for (Object[] row : topicRows) {
            String lesson = (String) row[0];
            String topic = (String) row[1];
            String status = (String) row[2];
            topicMap.computeIfAbsent(topic, k -> new java.util.ArrayList<>()).add(status);
            topicToLesson.put(topic, lesson);
        }

        List<AnalysisResponse.TopicHistoryDto> heatmap = new java.util.ArrayList<>();
        List<String> chronic = new java.util.ArrayList<>();
        List<String> improved = new java.util.ArrayList<>();
        List<String> inconsistent = new java.util.ArrayList<>();

        topicMap.forEach((topic, history) -> {
            heatmap.add(new AnalysisResponse.TopicHistoryDto(topicToLesson.get(topic), topic, history));
            
            if (history.size() >= 2) {
                String last = history.get(history.size() - 1);
                String prev = history.get(history.size() - 2);

                if (last.equals("WRONG") && prev.equals("WRONG")) {
                    chronic.add(topic);
                } else if (last.equals("CORRECT") && prev.equals("WRONG")) {
                    improved.add(topic);
                } else if (history.contains("WRONG") && history.contains("CORRECT")) {
                    inconsistent.add(topic);
                }
            }
        });

        AnalysisResponse.TopicTrendDataDto trendData = new AnalysisResponse.TopicTrendDataDto(heatmap, chronic, improved, inconsistent);

        return new AnalysisResponse(null, null, "GENEL GELİŞİM DOSYASI", java.time.LocalDateTime.now(), "APPROVED", examList.size(), null, "SUMMARY", null, null, null, null, targetName, targetScore, examList, new AnalysisResponse.ConsolidatedResultDto(lessonDtos), "Öğrencinin tüm zamanlardaki performans özetidir.", trendData);
    }

    @Transactional
    public void approveReport(UUID reportId) {
        AnalysisReport report = reportRepository.findById(reportId).orElseThrow();
        validateAccess(report.getStudentId()); // IDOR Kontrolü
        report.setStatus("APPROVED");
        reportRepository.save(report);
    }

    @Transactional
    public void rejectReport(UUID reportId) {
        AnalysisReport report = reportRepository.findById(reportId).orElseThrow();
        validateAccess(report.getStudentId()); // IDOR Kontrolü
        report.setStatus("REJECTED");
        reportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public String generateGlobalStrategicSummary(UUID studentId) {
        validateAccess(studentId); // IDOR Kontrolü
        List<AnalysisReport> approvedReports = reportRepository.findAllByStudentIdOrderByProcessedAtDesc(studentId)
                .stream().filter(r -> "APPROVED".equals(r.getStatus())).toList();
        if (approvedReports.isEmpty()) return "Henüz onaylanmış bir analiz raporu bulunmuyor.";
        StringBuilder historyBuilder = new StringBuilder();
        for (var report : approvedReports) {
            historyBuilder.append(String.format("- %s: %s (Öncelik: %s)\n", report.getProcessedAt(), report.getExamTitle(), report.getStrategicPriority()));
        }
        String prompt = "GÖREV: Sen kıdemli bir Eğitim Direktörüsün. Anonim akademik gelişim seyrini analiz et.\nGEÇMİŞ:\n" + historyBuilder.toString();
        return geminiAiService.generateText(prompt);
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getAnalysisDetail(UUID reportId, boolean cumulative) {
        AnalysisReport report = reportRepository.findById(reportId).orElseThrow();
        validateAccess(report.getStudentId()); // IDOR Kontrolü
        
        UUID studentId = report.getStudentId();
        String queryStr = cumulative 
            ? "SELECT es.exam_name, es.exam_date, es.total_score FROM exam_summaries es JOIN analysis_reports ar ON es.report_id = ar.id WHERE ar.student_id = :sid ORDER BY es.exam_date ASC"
            : "SELECT exam_name, exam_date, total_score FROM exam_summaries WHERE report_id = :rid";
        var query = entityManager.createNativeQuery(queryStr);
        if (cumulative) query.setParameter("sid", studentId); else query.setParameter("rid", reportId);
        List<Object[]> examRows = query.getResultList();
        List<AnalysisResponse.ExamSummaryDto> examList = examRows.stream().map(row -> new AnalysisResponse.ExamSummaryDto((String) row[0], (String) row[1], (java.math.BigDecimal) row[2])).toList();
        List<LessonAnalysis> currentLessons = lessonRepository.findAllByReportId(reportId);
        List<AnalysisResponse.LessonDto> lessonDtos = currentLessons.stream().map(lesson -> {
            int correct, wrong, empty; java.math.BigDecimal success;
            if (cumulative) {
                Object[] stats = (Object[]) entityManager.createNativeQuery("SELECT SUM(la.correct_count), SUM(la.wrong_count), SUM(la.empty_count), AVG(la.success_rate) FROM lesson_analyses la JOIN analysis_reports ar ON la.report_id = ar.id WHERE ar.student_id = :sid AND la.lesson_name = :lname AND ar.status = 'APPROVED'").setParameter("sid", studentId).setParameter("lname", lesson.getLessonName()).getSingleResult();
                correct = stats[0] != null ? ((Number) stats[0]).intValue() : lesson.getCorrectCount();
                wrong = stats[1] != null ? ((Number) stats[1]).intValue() : lesson.getWrongCount();
                empty = stats[2] != null ? ((Number) stats[2]).intValue() : lesson.getEmptyCount();
                success = stats[3] != null ? java.math.BigDecimal.valueOf(((Number) stats[3]).doubleValue()) : lesson.getSuccessRate();
            } else {
                correct = lesson.getCorrectCount(); wrong = lesson.getWrongCount(); empty = lesson.getEmptyCount(); success = lesson.getSuccessRate();
            }
            List<TopicDetail> topics = topicRepository.findAllByLessonAnalysisId(lesson.getId());
            List<AnalysisResponse.TopicDto> topicDtos = topics.stream().map(topic -> new AnalysisResponse.TopicDto(topic.getId(), topic.getTopicName(), topic.getStatus(), topic.getAiSuggestion(), topic.getTotalQuestions(), topic.getCorrectCount(), topic.getWrongCount())).toList();
            return new AnalysisResponse.LessonDto(lesson.getId(), lesson.getLessonName(), correct, wrong, empty, success, topicDtos);
        }).toList();
        String globalFeedback = feedbackRepository.findByReportId(reportId).map(AiGlobalFeedback::getContent).orElse("Hazırlanıyor...");
        StudentProfile profile = profileRepository.findByUserId(studentId).orElse(null);
        String targetName = null; java.math.BigDecimal targetScore = null;
        if (profile != null && profile.getTargetSchoolId() != null) {
            ReferenceSchool school = schoolRepository.findById(profile.getTargetSchoolId()).orElse(null);
            if (school != null) { targetName = school.getSchoolName(); targetScore = school.getBaseScore(); }
        }
        return new AnalysisResponse(report.getId(), report.getFileName(), report.getExamTitle(), report.getProcessedAt(), report.getStatus(), report.getIntendedExamCount(), report.getValidationErrors(), report.getReportType(), report.getMentorFeedback(), report.getFutureProjection(), report.getStrategicPriority(), report.getTeacherActionPlan(), targetName, targetScore, examList, new AnalysisResponse.ConsolidatedResultDto(lessonDtos), globalFeedback, null);
    }
}
