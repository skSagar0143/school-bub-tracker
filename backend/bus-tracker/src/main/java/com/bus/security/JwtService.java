package com.bus.security;

import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * Creates and verifies signed JWT access tokens.
 *
 * The signing secret must be supplied through the JWT_SECRET environment
 * variable as Base64-encoded random bytes (at least 256 bits for HS256).
 */
@Service
public class JwtService {

    private final String base64Secret;
    private final long accessTokenExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret:}") String base64Secret,
            @Value("${app.jwt.expiration-ms:900000}") long accessTokenExpirationMs) {
        this.base64Secret = base64Secret;
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    public String generateAccessToken(String subject, Collection<String> roles) {
        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("JWT subject must not be blank");
        }

        Instant now = Instant.now();
        return Jwts.builder()
                .subject(subject)
                .claim("roles", roles == null ? List.of() : List.copyOf(roles))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        if (!StringUtils.hasText(base64Secret)) {
            throw new IllegalStateException(
                    "JWT_SECRET is not configured. Set it as a Base64-encoded environment variable.");
        }

        try {
            byte[] keyBytes = Decoders.BASE64.decode(base64Secret);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (RuntimeException exception) {
            throw new IllegalStateException(
                    "JWT_SECRET must be valid Base64 and contain at least 32 random bytes.", exception);
        }
    }
}
