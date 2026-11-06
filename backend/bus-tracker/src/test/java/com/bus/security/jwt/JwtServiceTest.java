package com.bus.security.jwt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.jsonwebtoken.JwtException;

class JwtServiceTest {

    @TempDir
    Path tempDir;

    private JwtService jwtService;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();

        Path privateKey = tempDir.resolve("jwt-private.pem");
        Path publicKey = tempDir.resolve("jwt-public.pem");
        Files.writeString(privateKey, toPem("PRIVATE KEY", keyPair.getPrivate().getEncoded()));
        Files.writeString(publicKey, toPem("PUBLIC KEY", keyPair.getPublic().getEncoded()));

        jwtService = new JwtService(
                privateKey.toString(), publicKey.toString(), 900_000L, 604_800_000L);
    }

    @Test
    void shouldGenerateAndValidateRs256AccessToken() {
        String token = jwtService.generateAccessToken("user-123", List.of("ROLE_PARENT"));

        var claims = jwtService.parseAndValidateAccessToken(token);

        assertEquals("user-123", claims.getSubject());
        assertEquals("ACCESS", claims.get("tokenType"));
        assertEquals(List.of("ROLE_PARENT"), claims.get("authorities"));
        assertTrue(claims.getId() != null && !claims.getId().isBlank());
    }

    @Test
    void shouldGenerateRefreshTokenAndRejectItAsAccessToken() {
        String token = jwtService.generateRefreshToken("user-123");

        var claims = jwtService.parseAndValidateRefreshToken(token);

        assertEquals("user-123", claims.getSubject());
        assertEquals("REFRESH", claims.get("tokenType"));
        assertThrows(JwtException.class, () -> jwtService.parseAndValidateAccessToken(token));
    }

    @Test
    void shouldRejectBlankSubject() {
        assertThrows(IllegalArgumentException.class,
                () -> jwtService.generateAccessToken(" ", List.of()));
    }

    private String toPem(String label, byte[] encoded) {
        String body = Base64.getMimeEncoder(64, new byte[] {'\n'}).encodeToString(encoded);
        return "-----BEGIN " + label + "-----\n" + body + "\n-----END " + label + "-----\n";
    }
}
