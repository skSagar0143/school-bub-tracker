package com.bus.modules.user.service;

import java.util.List;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.common.exception.ResourceNotFoundException;
import com.bus.modules.user.dto.CreateUserRequest;
import com.bus.modules.user.dto.UpdateUserRequest;
import com.bus.modules.user.entity.User;
import com.bus.modules.user.entity.UserRole;
import com.bus.modules.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(CreateUserRequest request) {
        if (request.role() == UserRole.SCHOOL_ADMIN) {
            throw new IllegalArgumentException("School Admin accounts can only be provisioned during initial setup.");
        }
        if (userRepository.existsByEmailIgnoreCase(request.email().trim())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setEnabled(true);
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<User> getUsers() {
        return userRepository.findAllByRoleInOrderByCreatedAtDesc(
                List.of(UserRole.DRIVER, UserRole.STUDENT, UserRole.PARENT));
    }

    @Transactional(readOnly = true)
    public User getUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    public User updateUser(UUID id, UpdateUserRequest request) {
        User user = getUser(id);
        userRepository.findByEmailIgnoreCase(request.email().trim())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> { throw new IllegalArgumentException("Email is already in use."); });
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        return userRepository.save(user);
    }

    public User updateStatus(UUID id, boolean enabled) {
        User user = getUser(id);
        if (user.getRole() == UserRole.SCHOOL_ADMIN) {
            throw new IllegalArgumentException("School Admin status cannot be changed from User Management.");
        }
        user.setEnabled(enabled);
        return userRepository.save(user);
    }
}
