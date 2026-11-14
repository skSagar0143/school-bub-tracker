package com.bus.modules.user.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import com.bus.modules.user.entity.UserRole;

public record ManagedUserResponse(
        UUID id, String fullName, String loginId, String displayPassword,
        UserRole role, boolean enabled, LocalDateTime createdAt
) {}
