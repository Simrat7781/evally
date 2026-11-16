package com.example.demo.setup;

import com.example.demo.user.User;
import com.example.demo.user.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("bootstrap-admin")
public class SuperAdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public SuperAdminInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        String email = System.getenv("EVALly_ADMIN_EMAIL");
        String password = System.getenv("EVALly_ADMIN_PASSWORD");

        if (email == null || email.isBlank()
                || password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "Super Admin environment variables are missing."
            );
        }

        if (userRepository.existsByRole("SUPER_ADMIN")) {
            System.out.println("Super Admin already exists. Skipping setup.");
            return;
        }

        User admin = new User();
        admin.setFullName("Evally Super Admin");
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole("SUPER_ADMIN");
        admin.setOrganizationId(null);
        admin.setActive(true);

        userRepository.save(admin);

        System.out.println("Evally Super Admin created successfully.");
    }
}