package com.hankabakc.analyzepanel.analysis.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * AnalysisResponse: 5'li Birleştirilmiş Karne Analizi sonucunu taşıyan ana DTO.
 */
public record AnalysisResponse(
    UUID id,
    String fileName,
    String examTitle,
    LocalDateTime processedAt,
    String status,
    Integer intendedExamCount,
    String validationErrors,
    String reportType, // SINGLE, SUMMARY
    String mentorFeedback, // Koçluk Notları
    String futureProjection, // Gelecek Tahmini
    String strategicPriority, // Kritik Öncelik
    String teacherActionPlan, // Yeni: Öğretmen Aksiyon Planı
    String targetSchoolName, // Yeni: Hedef Okul
    java.math.BigDecimal targetSchoolScore, // Yeni: Hedef Puan
    
    // Sınavların Listesi
    List<ExamSummaryDto> examList,
    
    // Birleştirilmiş Genel Sonuç (Ders ve Konu Bazlı)
    ConsolidatedResultDto consolidatedResult,
    
    String globalFeedback,

    // Yeni: Kümülatif Trend Analizi Verileri
    TopicTrendDataDto topicTrendData
) {
    public record TopicTrendDataDto(
        List<TopicHistoryDto> heatmap,
        List<String> chronicTopics,
        List<String> improvedTopics,
        List<String> inconsistentTopics
    ) {}

    public record TopicHistoryDto(
        String lessonName,
        String topicName,
        List<String> statusHistory // CORRECT, WRONG, EMPTY listesi
    ) {}

    /**
     * ExamSummaryDto: Karnenin üst kısmındaki 5 sınavın özeti.
     */
    public record ExamSummaryDto(
        String examName,
        String examDate,
        BigDecimal totalScore
    ) {}

    /**
     * ConsolidatedResultDto: 5 denemenin toplam ders ve konu başarıları.
     */
    public record ConsolidatedResultDto(
        List<LessonDto> lessons
    ) {}

    public record LessonDto(
        UUID id,
        String lessonName,
        Integer correct,
        Integer wrong,
        Integer empty,
        BigDecimal successRate,
        List<TopicDto> topics
    ) {}

    public record TopicDto(
        UUID id,
        String topicName,
        String status,
        String aiSuggestion,
        Integer totalQuestions,
        Integer correctCount,
        Integer wrongCount
    ) {}
}
