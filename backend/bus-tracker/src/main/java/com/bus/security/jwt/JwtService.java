package com.bus.security.jwt;

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
 * JWT access-token adapter. Token issuance is called by the identity use case;
 * this class does not authenticate users or decide their permissions.
 */
@Service
public class JwtService {

    private final String base64Secret;
    private final long accessTokenExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret:}") String base64Secret,
            @Value("${app.jwt.expiration-ms:900000}") long accessTokenExpirationMs) {
        if (accessTokenExpirationMs <= 0) {
            throw new IllegalArgumentException("JWT access-token expiration must be positive");
        }
        this.base64Secret = base64Secret;
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    public String generateAccessToken(String subject, Collection<String> authorities) {
        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("JWT subject must not be blank");
        }

        Instant issuedAt = Instant.now();
        return Jwts.builder()
                .subject(subject)
                .claim("authorities", authorities == null ? List.of() : List.copyOf(authorities))
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(issuedAt.plusMillis(accessTokenExpirationMs)))
                .signWith(signingKey())
                .compact();
    }

    public Claims parseAndValidate(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey signingKey() {
        if (!StringUtils.hasText(base64Secret)) {
            throw new IllegalStateException(
                    "JWT secret is not configured. Set JWT_SECRET to a Base64-encoded random value of at least 32 bytes.");
        }

        try {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        } catch (RuntimeException exception) {
            throw new IllegalStateException(
                    "JWT_SECRET must be valid Base64 and contain at least 32 random bytes.", exception);
        }
    }
}
