package com.bus.modules.identity.domain;

import java.time.Instant;
import java.util.UUID;

public record UserAccount(
        UUID id,
        String fullName,
        String email,
        String passwordHash,
        UserRole role,
        boolean enabled,
        Instant createdAt) {
}
