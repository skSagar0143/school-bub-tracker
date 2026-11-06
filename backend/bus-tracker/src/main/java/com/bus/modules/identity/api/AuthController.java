package com.bus.modules.identity.api;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.bus.modules.identity.api.dto.AuthResponse;
import com.bus.modules.identity.api.dto.LoginRequest;
import com.bus.modules.identity.api.dto.LogoutRequest;
import com.bus.modules.identity.api.dto.RefreshRequest;
import com.bus.modules.identity.api.dto.RegisterRequest;
import com.bus.modules.identity.api.dto.UserResponse;
import com.bus.modules.identity.application.IdentityService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
@Validated
public class AuthController {
    private final IdentityService identityService;

    public AuthController(IdentityService identityService) {
        this.identityService = identityService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return AuthResponse.from(identityService.register(
                request.fullName(), request.email(), request.password()));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return AuthResponse.from(identityService.login(request.email(), request.password()));
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return AuthResponse.from(identityService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestBody(required = false) LogoutRequest request) {
        identityService.logout(request == null ? null : request.refreshToken());
    }

    @GetMapping("/me")
    public UserResponse currentUser(Authentication authentication) {
        return UserResponse.from(identityService.currentUser(authentication.getName()));
    }
}
