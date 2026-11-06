package com.bus.modules.user.dto;

public record LoginResponse(
        String tokenType, String accessToken, String refreshToken,
        long expiresInSeconds, UserResponse user
) {}
