package com.bus.modules.identity.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.bus.modules.identity.application.port.RefreshSessionPort;
import com.bus.modules.identity.application.port.UserAccountPort;
import com.bus.modules.identity.domain.UserAccount;
import com.bus.modules.identity.domain.UserRole;
import com.bus.security.jwt.JwtService;

class IdentityServiceTest {
    private UserAccountPort users;
    private RefreshSessionPort sessions;
    private PasswordEncoder encoder;
    private JwtService jwt;
    private IdentityService service;

    @BeforeEach
    void setUp() {
        users = mock(UserAccountPort.class);
        sessions = mock(RefreshSessionPort.class);
        encoder = mock(PasswordEncoder.class);
        jwt = mock(JwtService.class);
        service = new IdentityService(users, sessions, encoder, jwt, 900000);
    }

    @Test
    void registrationAlwaysCreatesParentRole() {
        when(users.existsByEmail("parent@example.com")).thenReturn(false);
        when(encoder.encode("StrongPass123")).thenReturn("hashed-password");
        when(users.save(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwt.generateAccessToken(anyString(), any())).thenReturn("access");
        when(jwt.generateRefreshToken(anyString())).thenReturn("refresh");
        var claims = mock(io.jsonwebtoken.Claims.class);
        when(claims.getExpiration()).thenReturn(java.util.Date.from(Instant.now().plusSeconds(3600)));
        when(jwt.parseAndValidateRefreshToken("refresh")).thenReturn(claims);

        var result = service.register("Test Parent", " PARENT@EXAMPLE.COM ", "StrongPass123");

        assertEquals(UserRole.PARENT, result.user().role());
        assertEquals("parent@example.com", result.user().email());
        verify(sessions).save(any());
    }

    @Test
    void duplicateEmailIsRejected() {
        when(users.existsByEmail("parent@example.com")).thenReturn(true);
        assertThrows(IdentityException.class,
                () -> service.register("Test Parent", "parent@example.com", "StrongPass123"));
        verify(users, never()).save(any());
    }

    @Test
    void invalidLoginUsesGenericUnauthorizedMessage() {
        when(users.findByEmail("parent@example.com")).thenReturn(Optional.empty());
        IdentityException exception = assertThrows(IdentityException.class,
                () -> service.login("parent@example.com", "wrong-password"));
        assertEquals(401, exception.getStatus());
    }
}
