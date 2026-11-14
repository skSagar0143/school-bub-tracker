package com.bus.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** email is retained as a backward-compatible JSON alias for older clients. */
public record LoginRequest(
        @Size(max = 180) String loginId,
        @Size(max = 180) String email,
        @NotBlank @Size(max = 72) String password
) {}
