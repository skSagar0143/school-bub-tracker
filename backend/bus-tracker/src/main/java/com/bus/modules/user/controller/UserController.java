package com.bus.modules.user.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.user.dto.CreateUserRequest;
import com.bus.modules.user.dto.UpdateUserRequest;
import com.bus.modules.user.dto.UserResponse;
import com.bus.modules.user.dto.UserStatusRequest;
import com.bus.modules.user.dto.ResetPasswordResponse;
import com.bus.modules.user.dto.ManagedUserResponse;
import com.bus.modules.user.service.CredentialEncryptionService;
import com.bus.modules.user.entity.UserRole;
import com.bus.modules.user.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SCHOOL_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "User Management", description = "School Admin manages driver, student and parent accounts")
public class UserController {
    private final UserService userService;
    private final CredentialEncryptionService credentialEncryptionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a Driver, Student or Parent account")
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return UserResponse.from(userService.createUser(request));
    }

    @GetMapping
    @Operation(summary = "List Driver, Student and Parent accounts")
    public List<ManagedUserResponse> getAll(@RequestParam(required = false) UserRole role) {
        return userService.getUsers(role).stream().map(user -> new ManagedUserResponse(
                user.getId(), user.getFullName(), user.getLoginId(),
                credentialEncryptionService.decrypt(user.getPasswordDisplayEncrypted()),
                user.getRole(), user.isEnabled(), user.getCreatedAt())).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a user account")
    public UserResponse getById(@PathVariable UUID id) {
        return UserResponse.from(userService.getUser(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user name and email")
    public UserResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest request) {
        return UserResponse.from(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a user account (soft delete; disables sign-in)")
    public void delete(@PathVariable UUID id) {
        userService.deleteUser(id);
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Reset a driver or student password and return the one-time temporary password")
    public ResetPasswordResponse resetPassword(@PathVariable UUID id) {
        return userService.resetPassword(id);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Enable or disable a user account")
    public UserResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody UserStatusRequest request) {
        return UserResponse.from(userService.updateStatus(id, request.enabled()));
    }
}
