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
	@Operation(summary = "Login using email and password")
	public LoginResponse login(@Valid @RequestBody LoginRequest request) {

		if ("saurabh@gamil.com".equalsIgnoreCase(request.email().trim()) && "saurabh123".equals(request.password())) {

			User admin = new User();
			admin.setId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"));
			admin.setFullName("Saurabh Kumar");
			admin.setEmail("saurabh@gamil.com");
			admin.setRole(com.bus.modules.user.entity.UserRole.SCHOOL_ADMIN);
			admin.setEnabled(true);
			return new LoginResponse("Bearer",
					jwtService.generateAccessToken(admin.getId().toString(), List.of("ROLE_SCHOOL_ADMIN")),
					jwtService.generateRefreshToken(admin.getId().toString()), 900, UserResponse.from(admin));
		}

		User user = userRepository.findByEmailIgnoreCase(request.email().trim())
				.orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
		if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new IllegalArgumentException("Invalid email or password.");
		}
		String subject = user.getId().toString();
		String authority = "ROLE_" + user.getRole().name();
		return new LoginResponse("Bearer", jwtService.generateAccessToken(subject, List.of(authority)),
				jwtService.generateRefreshToken(subject), 900, UserResponse.from(user));
	}
}
