package com.bus.modules.identity.infrastructure.persistence.entity;

import java.time.Instant;
import java.util.UUID;

import com.bus.modules.identity.domain.UserAccount;
import com.bus.modules.identity.domain.UserRole;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_accounts")
public class UserAccountEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 190)
    private String email;

    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected UserAccountEntity() {
    }

    public UserAccountEntity(UserAccount account) {
        this.id = account.id();
        this.fullName = account.fullName();
        this.email = account.email();
        this.passwordHash = account.passwordHash();
        this.role = account.role();
        this.enabled = account.enabled();
        this.createdAt = account.createdAt();
    }

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UserAccount toDomain() {
        return new UserAccount(id, fullName, email, passwordHash, role, enabled, createdAt);
    }

    public UUID getId() { return id; }
}
