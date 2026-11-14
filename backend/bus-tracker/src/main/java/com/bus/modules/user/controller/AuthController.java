package com.bus.modules.user.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.user.dto.LoginRequest;
import com.bus.modules.user.dto.LoginResponse;
import com.bus.modules.user.dto.UserResponse;
import com.bus.modules.user.entity.User;
import com.bus.modules.user.repository.UserRepository;
import com.bus.security.jwt.JwtService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Login using Login ID (or legacy email) and password")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        String identifier = request.loginId() != null && !request.loginId().isBlank()
                ? request.loginId().trim()
                : request.email() == null ? "" : request.email().trim();
        if (identifier.isBlank()) {
            throw new IllegalArgumentException("Login ID is required.");
        }

        User user = userRepository.findByLoginIdIgnoreCase(identifier)
                .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                .orElseThrow(() -> new IllegalArgumentException("Invalid login ID or password."));

        if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid login ID or password.");
        }

        String subject = user.getId().toString();
        String authority = "ROLE_" + user.getRole().name();
        return new LoginResponse("Bearer", jwtService.generateAccessToken(subject, List.of(authority)),
                jwtService.generateRefreshToken(subject), 900, UserResponse.from(user));
    }
}
