package com.bus.modules.identity.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.bus.modules.identity.application.port.RefreshSessionPort;
import com.bus.modules.identity.application.port.UserAccountPort;
import com.bus.modules.identity.domain.RefreshSession;
import com.bus.modules.identity.domain.UserAccount;
import com.bus.modules.identity.domain.UserRole;
import com.bus.security.jwt.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

@Service
public class IdentityService {

    private final UserAccountPort users;
    private final RefreshSessionPort refreshSessions;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final long accessTokenExpirationMs;

    public IdentityService(
            UserAccountPort users,
            RefreshSessionPort refreshSessions,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.jwt.expiration-ms:900000}") long accessTokenExpirationMs) {
        this.users = users;
        this.refreshSessions = refreshSessions;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    @Transactional
    public AuthResult register(String fullName, String email, String rawPassword) {
        String normalizedEmail = normalizeEmail(email);
        if (users.existsByEmail(normalizedEmail)) {
            throw new IdentityException("An account with this email already exists", 409);
        }
        if (!StringUtils.hasText(fullName) || fullName.trim().length() < 2) {
            throw new IdentityException("Please enter your full name", 400);
        }
        UserAccount account = new UserAccount(
                UUID.randomUUID(),
                fullName.trim(),
                normalizedEmail,
                passwordEncoder.encode(rawPassword),
                UserRole.PARENT,
                true,
                Instant.now());
        return createSession(users.save(account));
    }

    @Transactional
    public AuthResult login(String email, String rawPassword) {
        UserAccount account = users.findByEmail(normalizeEmail(email))
                .filter(UserAccount::enabled)
                .filter(user -> passwordEncoder.matches(rawPassword, user.passwordHash()))
                .orElseThrow(IdentityException::unauthorized);
        return createSession(account);
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        final Claims claims;
        try {
            claims = jwtService.parseAndValidateRefreshToken(rawRefreshToken);
        } catch (JwtException | IllegalArgumentException exception) {
            throw new IdentityException("Refresh token is invalid or expired", 401);
        }

        UUID userId;
        try {
            userId = UUID.fromString(claims.getSubject());
        } catch (RuntimeException exception) {
            throw new IdentityException("Refresh token is invalid", 401);
        }

        String tokenHash = sha256(rawRefreshToken);
        RefreshSession current = refreshSessions.findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> new IdentityException("Refresh session is no longer valid", 401));

        if (!current.userId().equals(userId) || current.isRevoked() || current.isExpired(Instant.now())) {
            throw new IdentityException("Refresh session is no longer valid", 401);
        }

        refreshSessions.save(current.revoke(Instant.now()));
        UserAccount account = users.findById(userId)
                .filter(UserAccount::enabled)
                .orElseThrow(() -> new IdentityException("Account is unavailable", 401));
        return createSession(account);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (!StringUtils.hasText(rawRefreshToken)) return;
        try {
            jwtService.parseAndValidateRefreshToken(rawRefreshToken);
            refreshSessions.findByTokenHashForUpdate(sha256(rawRefreshToken))
                    .filter(session -> !session.isRevoked())
                    .ifPresent(session -> refreshSessions.save(session.revoke(Instant.now())));
        } catch (JwtException | IllegalArgumentException ignored) {
            // Logout is intentionally idempotent for invalid, expired, or already-used tokens.
        }
    }

    @Transactional(readOnly = true)
    public UserAccount currentUser(String subject) {
        try {
            return users.findById(UUID.fromString(subject))
                    .filter(UserAccount::enabled)
                    .orElseThrow(() -> new IdentityException("Account is unavailable", 401));
        } catch (IllegalArgumentException exception) {
            throw new IdentityException("Account is unavailable", 401);
        }
    }

    private AuthResult createSession(UserAccount account) {
        String authority = "ROLE_" + account.role().name();
        String accessToken = jwtService.generateAccessToken(account.id().toString(), List.of(authority));
        String refreshToken = jwtService.generateRefreshToken(account.id().toString());
        Claims refreshClaims = jwtService.parseAndValidateRefreshToken(refreshToken);

        RefreshSession session = new RefreshSession(
                UUID.randomUUID(),
                account.id(),
                sha256(refreshToken),
                refreshClaims.getExpiration().toInstant(),
                null);
        refreshSessions.save(session);

        return new AuthResult(accessToken, refreshToken, accessTokenExpirationMs / 1000, account);
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new IdentityException("Email is required", 400);
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
