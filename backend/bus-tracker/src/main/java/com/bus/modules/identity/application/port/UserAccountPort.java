package com.bus.modules.identity.application.port;

import java.util.Optional;
import java.util.UUID;

import com.bus.modules.identity.domain.UserAccount;

public interface UserAccountPort {
    Optional<UserAccount> findByEmail(String email);
    Optional<UserAccount> findById(UUID id);
    boolean existsByEmail(String email);
    UserAccount save(UserAccount account);
}
