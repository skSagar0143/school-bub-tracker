package com.bus.modules.identity.api.dto;

import java.time.Instant;
import java.util.UUID;

import com.bus.modules.identity.domain.UserAccount;

public record UserResponse(UUID id, String fullName, String email, String role, Instant createdAt) {
    public static UserResponse from(UserAccount user) {
        return new UserResponse(
                user.id(), user.fullName(), user.email(), user.role().name(), user.createdAt());
    }
}
