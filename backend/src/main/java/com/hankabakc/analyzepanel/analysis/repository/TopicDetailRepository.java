package com.hankabakc.analyzepanel.analysis.repository;

import com.hankabakc.analyzepanel.analysis.entity.TopicDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TopicDetailRepository extends JpaRepository<TopicDetail, UUID> {
    List<TopicDetail> findAllByLessonAnalysisId(UUID lessonAnalysisId);
}
