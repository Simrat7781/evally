package com.example.demo.assessment;

import com.example.demo.ai.dto.GeneratedQuestion;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final QuestionRepository questionRepository;

    public AssessmentService(
            AssessmentRepository assessmentRepository,
            QuestionRepository questionRepository) {

        this.assessmentRepository = assessmentRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional
    public List<Question> saveApprovedQuestions(
            Long assessmentId,
            List<GeneratedQuestion> approvedQuestions) {

        // Check whether the assessment exists
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Assessment not found: " + assessmentId));

        if (approvedQuestions == null || approvedQuestions.isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one question must be provided");
        }

        long existingCount =
                questionRepository.countByAssessmentId(assessmentId);

        List<Question> questionsToSave = new ArrayList<>();

        for (GeneratedQuestion generated : approvedQuestions) {

            if (generated == null ||
                    generated.getQuestionText() == null ||
                    generated.getQuestionText().isBlank()) {
                throw new IllegalArgumentException(
                        "Question text cannot be empty");
            }

            String correctOption = generated.getCorrectOption() == null
                    ? ""
                    : generated.getCorrectOption().trim().toUpperCase();

            if (!List.of("A", "B", "C", "D").contains(correctOption)) {
                throw new IllegalArgumentException(
                        "Correct option must be A, B, C or D");
            }

            Question question = new Question();

            question.setAssessmentId(assessmentId);
            question.setQuestionText(generated.getQuestionText());
            question.setOptionA(generated.getOptionA());
            question.setOptionB(generated.getOptionB());
            question.setOptionC(generated.getOptionC());
            question.setOptionD(generated.getOptionD());
            question.setCorrectOption(correctOption);

            question.setMarks(1);

            String difficulty = generated.getDifficulty();

            question.setDifficulty(
                    difficulty == null || difficulty.isBlank()
                            ? assessment.getDifficulty()
                            : difficulty
            );

            questionsToSave.add(question);
        }

        // Save approved questions in PostgreSQL
        List<Question> savedQuestions =
                questionRepository.saveAll(questionsToSave);

        // Update the assessment's question count
        assessment.setTotalQuestions(
                Math.toIntExact(existingCount + savedQuestions.size())
        );

        assessmentRepository.save(assessment);

        return savedQuestions;
    }
}