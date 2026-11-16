package com.example.demo.student;

import com.example.demo.assessment.Question;
import com.example.demo.assessment.QuestionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;

@Service
public class StudentService {

    private static final String CHARS = "abcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StudentCredentialRepository credentialRepository;
    private final ExamSubmissionRepository submissionRepository;
    private final QuestionRepository questionRepository;

    public StudentService(
            StudentCredentialRepository credentialRepository,
            ExamSubmissionRepository submissionRepository,
            QuestionRepository questionRepository) {
        this.credentialRepository = credentialRepository;
        this.submissionRepository = submissionRepository;
        this.questionRepository = questionRepository;
    }

    /** Generate temp credentials for a list of enrollment numbers */
    @Transactional
    public List<StudentCredential> generateCredentials(Long assessmentId, List<String> enrollmentNumbers) {
        // Delete existing credentials for this assessment first
        credentialRepository.deleteByAssessmentId(assessmentId);

        List<StudentCredential> created = new ArrayList<>();
        for (String enr : enrollmentNumbers) {
            StudentCredential cred = new StudentCredential();
            cred.setAssessmentId(assessmentId);
            cred.setEnrollmentNumber(enr.trim());
            cred.setUsername(generateUsername(enr));
            cred.setPassword(generatePassword());
            created.add(cred);
        }
        return credentialRepository.saveAll(created);
    }

    /** Authenticate a student by temp credentials */
    public Optional<StudentCredential> authenticate(String username, String password) {
        return credentialRepository.findByUsername(username)
                .filter(c -> c.getPassword().equals(password) && !Boolean.TRUE.equals(c.getExamCompleted()));
    }

    /** Get all students across all assessments */
    public List<StudentCredential> getAllStudents() {
        return credentialRepository.findAll();
    }

    /** Evaluate and store submission */
    @Transactional
    public ExamSubmission submitExam(Long studentCredentialId, Long assessmentId,
                                     String enrollmentNumber, List<AnswerDTO> answers,
                                     int tabSwitchCount) {

        List<Question> questions = questionRepository.findByAssessmentId(assessmentId);
        Map<Long, String> correctMap = new HashMap<>();
        for (Question q : questions) {
            correctMap.put(q.getId(), q.getCorrectOption());
        }

        int score = 0;
        for (AnswerDTO a : answers) {
            String correct = correctMap.get(a.questionId());
            if (correct != null && correct.equalsIgnoreCase(a.selectedOption())) {
                score++;
            }
        }

        int totalMarks = questions.size();
        double percentage = totalMarks > 0 ? (score * 100.0 / totalMarks) : 0;
        boolean passed = percentage >= 40.0;

        ExamSubmission submission = new ExamSubmission();
        submission.setStudentCredentialId(studentCredentialId);
        submission.setAssessmentId(assessmentId);
        submission.setEnrollmentNumber(enrollmentNumber);
        submission.setScore(score);
        submission.setTotalMarks(totalMarks);
        submission.setPercentage(percentage);
        submission.setPassed(passed);
        submission.setTabSwitchCount(tabSwitchCount);

        ExamSubmission saved = submissionRepository.save(submission);

        // Mark credential as completed
        credentialRepository.findById(studentCredentialId).ifPresent(c -> {
            c.setExamCompleted(true);
            credentialRepository.save(c);
        });

        return saved;
    }

    /** Delete all student credentials and submissions for an assessment (cleanup) */
    @Transactional
    public void cleanup(Long assessmentId) {
        List<StudentCredential> creds = credentialRepository.findByAssessmentId(assessmentId);
        List<Long> credIds = creds.stream().map(StudentCredential::getId).toList();
        // delete submissions first (FK)
        submissionRepository.findByAssessmentIdOrderByScoreDesc(assessmentId)
                .forEach(s -> submissionRepository.delete(s));
        credentialRepository.deleteByAssessmentId(assessmentId);
    }

    /** Results ranked by score desc */
    public List<ExamSubmission> getResults(Long assessmentId) {
        return submissionRepository.findByAssessmentIdOrderByScoreDesc(assessmentId);
    }

    // ---- helpers ----
    private String generateUsername(String enrollmentNumber) {
        String base = "STU_" + enrollmentNumber.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        return base.length() > 30 ? base.substring(0, 30) : base;
    }

    private String generatePassword() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    public record AnswerDTO(Long questionId, String selectedOption) {}
}
