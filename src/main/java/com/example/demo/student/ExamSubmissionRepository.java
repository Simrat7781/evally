package com.example.demo.student;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamSubmissionRepository extends JpaRepository<ExamSubmission, Long> {
    List<ExamSubmission> findByAssessmentIdOrderByScoreDesc(Long assessmentId);
    boolean existsByStudentCredentialId(Long studentCredentialId);
}
