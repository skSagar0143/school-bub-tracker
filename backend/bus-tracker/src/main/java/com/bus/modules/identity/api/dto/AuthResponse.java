package com.bus.modules.identity.api.dto;

import com.bus.modules.identity.application.AuthResult;

public record AuthResponse(
        String tokenType,
        String accessToken,
        String refreshToken,
        long expiresInSeconds,
        UserResponse user) {
    public static AuthResponse from(AuthResult result) {
        return new AuthResponse("Bearer", result.accessToken(), result.refreshToken(),
                result.expiresInSeconds(), UserResponse.from(result.user()));
    }
}
