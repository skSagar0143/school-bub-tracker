package com.bus.modules.identity.application;

import com.bus.modules.identity.domain.UserAccount;

public record AuthResult(
        String accessToken,
        String refreshToken,
        long expiresInSeconds,
        UserAccount user) {
}
