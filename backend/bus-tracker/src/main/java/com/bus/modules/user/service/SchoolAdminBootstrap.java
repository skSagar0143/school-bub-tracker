package com.bus.modules.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.bus.modules.user.entity.User;
import com.bus.modules.user.entity.UserRole;
import com.bus.modules.user.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * One-time initial School Admin provisioning. Credentials are supplied locally
 * through environment variables and are never stored in source control.
 */
@Component
@ConditionalOnProperty(name = "app.bootstrap.admin.enabled", havingValue = "true")
@Slf4j
public class SchoolAdminBootstrap implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String fullName;

    public SchoolAdminBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.admin.email:saurabh@gamil.com}") String email,
            @Value("${app.bootstrap.admin.password:}") String password,
            @Value("${app.bootstrap.admin.full-name:Saurabh Kumar}") String fullName) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    @Override
    public void run(String... args) {
        if (!StringUtils.hasText(password) || password.length() < 8) {
            throw new IllegalStateException(
                    "Set APP_BOOTSTRAP_ADMIN_PASSWORD to a password of at least 8 characters.");
        }

        if (userRepository.existsByEmailIgnoreCase(email)) {
            log.info("Initial School Admin already exists; bootstrap skipped.");
            return;
        }

        User admin = new User();
        admin.setFullName(fullName);
        admin.setEmail(email.trim().toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(UserRole.SCHOOL_ADMIN);
        admin.setEnabled(true);
        userRepository.save(admin);
        log.info("Initial School Admin account provisioned for {}", email);
    }
}
