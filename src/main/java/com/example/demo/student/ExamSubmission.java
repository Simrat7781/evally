package com.example.demo.student;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_submissions")
public class ExamSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_credential_id", nullable = false)
    private Long studentCredentialId;

    @Column(name = "assessment_id", nullable = false)
    private Long assessmentId;

    @Column(name = "enrollment_number", nullable = false, length = 100)
    private String enrollmentNumber;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "total_marks", nullable = false)
    private Integer totalMarks;

    @Column(nullable = false)
    private Double percentage;

    private Boolean passed;

    @Column(name = "tab_switch_count")
    private Integer tabSwitchCount = 0;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    public ExamSubmission() {}

    @PrePersist
    protected void onSubmit() {
        if (submittedAt == null) submittedAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() { return id; }

    public Long getStudentCredentialId() { return studentCredentialId; }
    public void setStudentCredentialId(Long studentCredentialId) { this.studentCredentialId = studentCredentialId; }

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public String getEnrollmentNumber() { return enrollmentNumber; }
    public void setEnrollmentNumber(String enrollmentNumber) { this.enrollmentNumber = enrollmentNumber; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Integer getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Integer totalMarks) { this.totalMarks = totalMarks; }

    public Double getPercentage() { return percentage; }
    public void setPercentage(Double percentage) { this.percentage = percentage; }

    public Boolean getPassed() { return passed; }
    public void setPassed(Boolean passed) { this.passed = passed; }

    public Integer getTabSwitchCount() { return tabSwitchCount; }
    public void setTabSwitchCount(Integer tabSwitchCount) { this.tabSwitchCount = tabSwitchCount; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
}
