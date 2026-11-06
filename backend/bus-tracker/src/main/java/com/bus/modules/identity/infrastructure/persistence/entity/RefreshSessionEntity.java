package com.bus.modules.identity.infrastructure.persistence.entity;

import java.time.Instant;
import java.util.UUID;

import com.bus.modules.identity.domain.RefreshSession;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "refresh_sessions")
public class RefreshSessionEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccountEntity user;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant revokedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected RefreshSessionEntity() {
    }

    public RefreshSessionEntity(RefreshSession session, UserAccountEntity user) {
        this.id = session.id();
        this.user = user;
        this.tokenHash = session.tokenHash();
        this.expiresAt = session.expiresAt();
        this.revokedAt = session.revokedAt();
    }

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public RefreshSession toDomain() {
        return new RefreshSession(id, user.getId(), tokenHash, expiresAt, revokedAt);
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }
}
