package com.bus.modules.user.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import com.bus.modules.user.entity.User;
import com.bus.modules.user.entity.UserRole;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    Optional<User> findByLoginIdIgnoreCase(String loginId);
    boolean existsByLoginIdIgnoreCase(String loginId);
    boolean existsByRole(UserRole role);
    List<User> findAllByRoleInOrderByCreatedAtDesc(List<UserRole> roles);
}
