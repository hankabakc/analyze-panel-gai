package com.hankabakc.analyzepanel.analysis.entity;

import jakarta.persistence.*;
import java.util.UUID;

/**
 * AiGlobalFeedback: Bir analizin tamamı için AI tarafından üretilen 
 * genel metinsel değerlendirmeyi tutar.
 */
@Entity
@Table(name = "ai_global_feedback")
public class AiGlobalFeedback {

    @Id
    private UUID id;

    @Column(name = "report_id", nullable = false)
    private UUID reportId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    public AiGlobalFeedback() {
    }

    public AiGlobalFeedback(UUID id, UUID reportId, String content) {
        this.id = id;
        this.reportId = reportId;
        this.content = content;
    }

    /* Getter ve Setter Metotları */
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getReportId() { return reportId; }
    public void setReportId(UUID reportId) { this.reportId = reportId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
