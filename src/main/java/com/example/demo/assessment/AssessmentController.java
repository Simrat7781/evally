package com.example.demo.assessment;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    private final AssessmentService assessmentService;
    private final AssessmentRepository assessmentRepository;

    public AssessmentController(
            AssessmentService assessmentService,
            AssessmentRepository assessmentRepository) {
        this.assessmentService = assessmentService;
        this.assessmentRepository = assessmentRepository;
    }

    /** GET /api/assessments — list all assessments */
    @GetMapping
    public ResponseEntity<List<Assessment>> listAssessments() {
        return ResponseEntity.ok(assessmentRepository.findAll());
    }

    /** GET /api/assessments/{id} — get one assessment */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAssessment(@PathVariable Long id) {
        return assessmentRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createAssessment(
            @RequestBody Assessment assessment) {

        if (assessment.getTitle() == null ||
                assessment.getTitle().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Assessment title is required");
        }

        if (assessment.getDurationMinutes() == null ||
                assessment.getDurationMinutes() <= 0) {
            return ResponseEntity.badRequest()
                    .body("Duration must be greater than zero");
        }

        assessment.setTotalQuestions(0);
        assessment.setActive(true);

        Assessment saved = assessmentRepository.save(assessment);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{assessmentId}/questions")
    public ResponseEntity<?> saveQuestions(
            @PathVariable Long assessmentId,
            @RequestBody java.util.List<com.example.demo.ai.dto.GeneratedQuestion> questions) {

        try {
            return ResponseEntity.ok(
                    assessmentService.saveApprovedQuestions(assessmentId, questions)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}