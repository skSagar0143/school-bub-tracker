package com.bus.modules.identity.application.port;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import com.bus.modules.identity.domain.RefreshSession;

public interface RefreshSessionPort {
    Optional<RefreshSession> findByTokenHashForUpdate(String tokenHash);
    RefreshSession save(RefreshSession session);
    void revokeAllActiveForUser(UUID userId, Instant revokedAt);
}
