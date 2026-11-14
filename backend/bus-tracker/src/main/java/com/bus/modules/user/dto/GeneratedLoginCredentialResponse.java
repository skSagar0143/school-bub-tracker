package com.bus.modules.user.dto;

import com.bus.modules.user.entity.UserRole;

public record GeneratedLoginCredentialResponse(
        Long recordId,
        String fullName,
        String code,
        UserRole role,
        String loginId,
        String temporaryPassword
) {}
