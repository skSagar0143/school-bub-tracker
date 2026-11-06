package com.bus.modules.identity.infrastructure.persistence.adapter;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.bus.modules.identity.application.port.UserAccountPort;
import com.bus.modules.identity.domain.UserAccount;
import com.bus.modules.identity.infrastructure.persistence.entity.UserAccountEntity;
import com.bus.modules.identity.infrastructure.persistence.repository.SpringDataUserAccountRepository;

@Repository
public class UserAccountPersistenceAdapter implements UserAccountPort {

    private final SpringDataUserAccountRepository repository;

    public UserAccountPersistenceAdapter(SpringDataUserAccountRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<UserAccount> findByEmail(String email) {
        return repository.findByEmailIgnoreCase(email).map(UserAccountEntity::toDomain);
    }

    @Override
    public Optional<UserAccount> findById(UUID id) {
        return repository.findById(id).map(UserAccountEntity::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmailIgnoreCase(email);
    }

    @Override
    public UserAccount save(UserAccount account) {
        return repository.save(new UserAccountEntity(account)).toDomain();
    }
}
