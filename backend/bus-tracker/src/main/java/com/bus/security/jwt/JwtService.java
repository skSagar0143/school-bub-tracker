package com.bus.security.jwt;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

/**
 * RSA-backed JWT adapter. Private key signs tokens; public key verifies them.
 * Authentication and authorization decisions remain in the identity/application layers.
 */
@Service
public class JwtService {

    private static final String ACCESS = "ACCESS";
    private static final String REFRESH = "REFRESH";

    private final Path privateKeyPath;
    private final Path publicKeyPath;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtService(
            @Value("${app.jwt.private-key-path:./secrets/jwt-private.pem}") String privateKeyPath,
            @Value("${app.jwt.public-key-path:./secrets/jwt-public.pem}") String publicKeyPath,
            @Value("${app.jwt.expiration-ms:900000}") long accessTokenExpirationMs,
            @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshTokenExpirationMs) {
        if (accessTokenExpirationMs <= 0 || refreshTokenExpirationMs <= 0) {
            throw new IllegalArgumentException("JWT token expirations must be positive");
        }
        this.privateKeyPath = Path.of(privateKeyPath);
        this.publicKeyPath = Path.of(publicKeyPath);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String generateAccessToken(String subject, Collection<String> authorities) {
        return generateToken(subject, authorities, ACCESS, accessTokenExpirationMs);
    }

    public String generateRefreshToken(String subject) {
        return generateToken(subject, List.of(), REFRESH, refreshTokenExpirationMs);
    }

    public Claims parseAndValidateAccessToken(String token) {
        Claims claims = parseAndValidate(token);
        if (!ACCESS.equals(claims.get("tokenType", String.class))) {
            throw new io.jsonwebtoken.JwtException("A refresh token cannot be used as an access token");
        }
        return claims;
    }

    public Claims parseAndValidateRefreshToken(String token) {
        Claims claims = parseAndValidate(token);
        if (!REFRESH.equals(claims.get("tokenType", String.class))) {
            throw new io.jsonwebtoken.JwtException("An access token cannot be used as a refresh token");
        }
        return claims;
    }

    private String generateToken(
            String subject, Collection<String> authorities, String tokenType, long expirationMs) {
        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("JWT subject must not be blank");
        }

        Instant now = Instant.now();
        var builder = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(subject)
                .claim("tokenType", tokenType)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)));

        if (ACCESS.equals(tokenType)) {
            builder.claim("authorities", authorities == null ? List.of() : List.copyOf(authorities));
        }

        return builder.signWith(loadPrivateKey(), Jwts.SIG.RS256).compact();
    }

    private Claims parseAndValidate(String token) {
        if (!StringUtils.hasText(token)) {
            throw new IllegalArgumentException("JWT token must not be blank");
        }
        return Jwts.parser()
                .verifyWith(loadPublicKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private PrivateKey loadPrivateKey() {
        try {
            byte[] keyBytes = decodePem(Files.readString(privateKeyPath), "PRIVATE KEY");
            return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Cannot load RSA private key from " + privateKeyPath
                            + ". Expected an unencrypted PKCS#8 PEM file.",
                    exception);
        }
    }

    private PublicKey loadPublicKey() {
        try {
            byte[] keyBytes = decodePem(Files.readString(publicKeyPath), "PUBLIC KEY");
            return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(keyBytes));
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Cannot load RSA public key from " + publicKeyPath
                            + ". Expected an X.509 SubjectPublicKeyInfo PEM file.",
                    exception);
        }
    }

    private byte[] decodePem(String pem, String label) {
        String header = "-----BEGIN " + label + "-----";
        String footer = "-----END " + label + "-----";
        String base64 = pem.replace(header, "").replace(footer, "").replaceAll("\\s", "");
        return Base64.getDecoder().decode(base64);
    }
}
