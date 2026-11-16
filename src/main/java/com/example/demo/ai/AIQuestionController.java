package com.example.demo.ai;

import com.example.demo.ai.dto.GeneratedQuestion;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AIQuestionController {

    private final AIQuestionService aiQuestionService;

    public AIQuestionController(AIQuestionService aiQuestionService) {
        this.aiQuestionService = aiQuestionService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateQuestions(
            @RequestBody GenerateQuestionRequest request) {

        if (request.topic() == null || request.topic().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Topic is required");
        }

        if (request.difficulty() == null ||
                !List.of("Easy", "Medium", "Hard")
                        .contains(request.difficulty())) {
            return ResponseEntity.badRequest()
                    .body("Difficulty must be Easy, Medium, or Hard");
        }

        if (request.numberOfQuestions() < 1 ||
                request.numberOfQuestions() > 50) {
            return ResponseEntity.badRequest()
                    .body("Question count must be between 1 and 50");
        }

        List<GeneratedQuestion> questions =
                aiQuestionService.generateQuestions(
                        request.topic(),
                        request.difficulty(),
                        request.numberOfQuestions()
                );

        return ResponseEntity.ok(questions);
    }

    public record GenerateQuestionRequest(
            String topic,
            String difficulty,
            int numberOfQuestions
    ) {
    }
}