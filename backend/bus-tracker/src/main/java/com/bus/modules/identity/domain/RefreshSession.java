package com.bus.modules.identity.domain;

import java.time.Instant;
import java.util.UUID;

public record RefreshSession(
        UUID id,
        UUID userId,
        String tokenHash,
        Instant expiresAt,
        Instant revokedAt) {

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isExpired(Instant now) {
        return !expiresAt.isAfter(now);
    }

    public RefreshSession revoke(Instant at) {
        return new RefreshSession(id, userId, tokenHash, expiresAt, at);
    }
}
