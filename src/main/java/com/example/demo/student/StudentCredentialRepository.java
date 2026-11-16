package com.example.demo.student;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudentCredentialRepository extends JpaRepository<StudentCredential, Long> {
    List<StudentCredential> findByAssessmentId(Long assessmentId);
    Optional<StudentCredential> findByUsername(String username);
    void deleteByAssessmentId(Long assessmentId);
    boolean existsByUsername(String username);
}
