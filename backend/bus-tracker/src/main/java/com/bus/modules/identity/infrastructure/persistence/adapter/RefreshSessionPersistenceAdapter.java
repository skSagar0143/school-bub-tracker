package com.bus.modules.identity.infrastructure.persistence.adapter;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.identity.application.port.RefreshSessionPort;
import com.bus.modules.identity.domain.RefreshSession;
import com.bus.modules.identity.infrastructure.persistence.entity.RefreshSessionEntity;
import com.bus.modules.identity.infrastructure.persistence.repository.SpringDataRefreshSessionRepository;
import com.bus.modules.identity.infrastructure.persistence.repository.SpringDataUserAccountRepository;

@Repository
public class RefreshSessionPersistenceAdapter implements RefreshSessionPort {

    private final SpringDataRefreshSessionRepository sessions;
    private final SpringDataUserAccountRepository users;

    public RefreshSessionPersistenceAdapter(
            SpringDataRefreshSessionRepository sessions,
            SpringDataUserAccountRepository users) {
        this.sessions = sessions;
        this.users = users;
    }

    @Override
    @Transactional
    public Optional<RefreshSession> findByTokenHashForUpdate(String tokenHash) {
        return sessions.findByTokenHashForUpdate(tokenHash).map(RefreshSessionEntity::toDomain);
    }

    @Override
    @Transactional
    public RefreshSession save(RefreshSession session) {
        var user = users.findById(session.userId())
                .orElseThrow(() -> new IllegalStateException("Refresh session user no longer exists"));
        var entity = sessions.findById(session.id())
                .orElseGet(() -> new RefreshSessionEntity(session, user));
        if (session.revokedAt() != null) entity.setRevokedAt(session.revokedAt());
        return sessions.save(entity).toDomain();
    }

    @Override
    @Transactional
    public void revokeAllActiveForUser(UUID userId, Instant revokedAt) {
        sessions.findAllByUser_IdAndRevokedAtIsNull(userId)
                .forEach(session -> session.setRevokedAt(revokedAt));
    }
}
