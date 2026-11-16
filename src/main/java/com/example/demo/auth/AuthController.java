package com.example.demo.auth;

import com.example.demo.user.User;
import com.example.demo.user.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        User user = userRepository
                .findByEmail(request.email())
                .orElse(null);

        if (user == null ||
                !Boolean.TRUE.equals(user.getActive()) ||
                !passwordEncoder.matches(
                        request.password(),
                        user.getPasswordHash())) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole()
        );

        return ResponseEntity.ok(
                new LoginResponse(
                        "Login successful",
                        token,
                        user.getEmail(),
                        user.getRole()
                )
        );
    }

    public record LoginRequest(
            String email,
            String password
    ) {}

    public record LoginResponse(
            String message,
            String token,
            String email,
            String role
    ) {}
}