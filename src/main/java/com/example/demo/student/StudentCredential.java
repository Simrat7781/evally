package com.example.demo.student;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_credentials")
public class StudentCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assessment_id", nullable = false)
    private Long assessmentId;

    @Column(name = "enrollment_number", nullable = false, length = 100)
    private String enrollmentNumber;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    // Stored in plain text (temporary only, cleaned up after exam)
    @Column(nullable = false, length = 100)
    private String password;

    @Column(name = "exam_completed")
    private Boolean examCompleted = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public StudentCredential() {}

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (examCompleted == null) examCompleted = false;
    }

    // Getters & Setters
    public Long getId() { return id; }

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public String getEnrollmentNumber() { return enrollmentNumber; }
    public void setEnrollmentNumber(String enrollmentNumber) { this.enrollmentNumber = enrollmentNumber; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getExamCompleted() { return examCompleted; }
    public void setExamCompleted(Boolean examCompleted) { this.examCompleted = examCompleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
