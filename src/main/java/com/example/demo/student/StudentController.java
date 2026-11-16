package com.example.demo.student;

import com.example.demo.assessment.Question;
import com.example.demo.assessment.QuestionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StudentController {

    private final StudentService studentService;
    private final QuestionRepository questionRepository;

    public StudentController(StudentService studentService, QuestionRepository questionRepository) {
        this.studentService = studentService;
        this.questionRepository = questionRepository;
    }

    // ---- Admin: generate credentials for an assessment ----
    @PostMapping("/assessments/{assessmentId}/students/generate")
    public ResponseEntity<?> generateCredentials(
            @PathVariable Long assessmentId,
            @RequestBody GenerateCredentialsRequest request) {

        if (request.enrollmentNumbers() == null || request.enrollmentNumbers().isEmpty()) {
            return ResponseEntity.badRequest().body("No enrollment numbers provided");
        }

        List<StudentCredential> creds = studentService.generateCredentials(
                assessmentId, request.enrollmentNumbers());
        return ResponseEntity.ok(creds);
    }

    // ---- Admin: list students for an assessment ----
    @GetMapping("/assessments/{assessmentId}/students")
    public ResponseEntity<List<StudentCredential>> listStudents(@PathVariable Long assessmentId) {
        return ResponseEntity.ok(studentService.getAllStudents().stream()
                .filter(s -> s.getAssessmentId().equals(assessmentId))
                .toList());
    }

    // ---- Admin: list ALL students ----
    @GetMapping("/students")
    public ResponseEntity<List<StudentCredential>> allStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    // ---- Admin: cleanup credentials for an assessment ----
    @DeleteMapping("/assessments/{assessmentId}/students/cleanup")
    public ResponseEntity<?> cleanup(@PathVariable Long assessmentId) {
        studentService.cleanup(assessmentId);
        return ResponseEntity.ok(Map.of("message", "Cleanup complete"));
    }

    // ---- Admin: results for an assessment ----
    @GetMapping("/assessments/{assessmentId}/results")
    public ResponseEntity<List<ExamSubmission>> results(@PathVariable Long assessmentId) {
        return ResponseEntity.ok(studentService.getResults(assessmentId));
    }

    // ---- Student: login with temp credentials ----
    @PostMapping("/student/login")
    public ResponseEntity<?> studentLogin(@RequestBody StudentLoginRequest request) {
        return studentService.authenticate(request.username(), request.password())
                .<ResponseEntity<?>>map(cred -> ResponseEntity.ok(Map.of(
                        "message", "Login successful",
                        "token", "TEMP_TOKEN_" + cred.getId(),
                        "enrollmentNumber", cred.getEnrollmentNumber(),
                        "assessmentId", cred.getAssessmentId(),
                        "studentId", cred.getId(),
                        "durationMinutes", 60  // will be overridden by assessment
                )))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid credentials or exam already completed")));
    }

    // ---- Student: get questions for exam (strips correct answers) ----
    @GetMapping("/student/exam/{assessmentId}/questions")
    public ResponseEntity<List<SafeQuestion>> getExamQuestions(@PathVariable Long assessmentId) {
        List<Question> questions = questionRepository.findByAssessmentId(assessmentId);
        List<SafeQuestion> safe = questions.stream()
                .map(q -> new SafeQuestion(
                        q.getId(),
                        q.getQuestionText(),
                        q.getOptionA(),
                        q.getOptionB(),
                        q.getOptionC(),
                        q.getOptionD(),
                        q.getMarks()
                )).toList();
        return ResponseEntity.ok(safe);
    }

    // ---- Student: submit exam ----
    @PostMapping("/student/exam/submit")
    public ResponseEntity<?> submitExam(@RequestBody ExamSubmitRequest request) {
        try {
            // Validate student credential exists
            ExamSubmission result = studentService.submitExam(
                    request.studentId(),
                    request.assessmentId(),
                    request.enrollmentNumber() != null ? request.enrollmentNumber() : "UNKNOWN",
                    request.answers().stream()
                            .map(a -> new StudentService.AnswerDTO(a.questionId(), a.selectedOption()))
                            .toList(),
                    request.tabSwitchCount()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ---- Records ----
    public record GenerateCredentialsRequest(List<String> enrollmentNumbers) {}

    public record StudentLoginRequest(String username, String password) {}

    public record SafeQuestion(
            Long id,
            String questionText,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            Integer marks
    ) {}

    public record ExamSubmitRequest(
            Long studentId,
            Long assessmentId,
            String enrollmentNumber,
            List<AnswerItem> answers,
            int tabSwitchCount
    ) {}

    public record AnswerItem(Long questionId, String selectedOption) {}
}
