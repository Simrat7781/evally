package com.example.demo.ai;

import com.example.demo.ai.dto.GeneratedQuestion;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class AIQuestionService {

    @Value("${nvidia.api-key}")
    private String apiKey;

    @Value("${nvidia.model}")
    private String model;

    @Value("${nvidia.api-url}")
    private String apiUrl;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AIQuestionService(ObjectMapper objectMapper) {
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
    }

    public List<GeneratedQuestion> generateQuestions(
            String topic,
            String difficulty,
            int numberOfQuestions) {

        if (topic == null || topic.isBlank()) {
            throw new IllegalArgumentException("Topic is required");
        }

        if (numberOfQuestions < 1 || numberOfQuestions > 50) {
            throw new IllegalArgumentException(
                    "Number of questions must be between 1 and 50");
        }

        String prompt = """
                Generate exactly %d multiple-choice questions.

                Topic: %s
                Difficulty: %s

                Requirements:
                1. Each question must have four options.
                2. Options must be labelled A, B, C and D.
                3. Exactly one option must be correct.
                4. Include a clear explanation.
                5. Avoid duplicate questions.
                6. Questions must be factually accurate.

                Return ONLY valid JSON in this format:
                {
                  "questions": [
                    {
                      "questionText": "Question here",
                      "optionA": "Option A",
                      "optionB": "Option B",
                      "optionC": "Option C",
                      "optionD": "Option D",
                      "correctOption": "B",
                      "explanation": "Explanation here",
                      "difficulty": "%s"
                    }
                  ]
                }
                """.formatted(
                numberOfQuestions,
                topic,
                difficulty,
                difficulty
        );

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content", "You are an expert exam question generator. Return valid JSON only."
                        ),
                        Map.of(
                                "role", "user",
                                "content", prompt
                        )
                ),
                "temperature", 0.3,
                "max_tokens", 12000,
                "response_format", Map.of("type", "json_object")
        );

        try {
            JsonNode response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new IllegalStateException("Empty response from NVIDIA");
            }

            String content = response
                    .path("choices")
                    .path(0)
                    .path("message")
                    .path("content")
                    .asText();

            JsonNode generatedJson =
                    objectMapper.readTree(content);

            JsonNode questionsNode =
                    generatedJson.path("questions");

            if (!questionsNode.isArray()) {
                throw new IllegalStateException(
                        "AI returned an invalid questions format");
            }

            List<GeneratedQuestion> questions =
                    objectMapper.readerForListOf(GeneratedQuestion.class)
                            .readValue(questionsNode);

            if (questions.size() != numberOfQuestions) {
                throw new IllegalStateException(
                        "AI returned an unexpected number of questions");
            }

            return questions;

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to generate questions: " + e.getMessage(), e);
        }
    }
}