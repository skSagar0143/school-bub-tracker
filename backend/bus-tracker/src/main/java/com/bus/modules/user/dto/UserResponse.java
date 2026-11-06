package com.bus.modules.user.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import com.bus.modules.user.entity.User;
import com.bus.modules.user.entity.UserRole;

public record UserResponse(
        UUID id, String fullName, String email, UserRole role,
        boolean enabled, LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(),
                user.getRole(), user.isEnabled(), user.getCreatedAt(), user.getUpdatedAt());
    }
}
