package com.bus.modules.user.service;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CredentialEncryptionService {
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();
    private final SecretKeySpec key;

    public CredentialEncryptionService(@Value("${app.credentials.encryption-key}") String encodedKey) {
        byte[] keyBytes = Base64.getDecoder().decode(encodedKey);
        if (keyBytes.length != 32) {
            throw new IllegalArgumentException("CREDENTIAL_ENCRYPTION_KEY must be a Base64-encoded 32-byte key.");
        }
        this.key = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String value) {
        if (value == null) return null;
        try {
            byte[] iv = new byte[IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + encrypted.length)
                    .put(iv).put(encrypted).array());
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to encrypt generated login credential.", ex);
        }
    }

    public String decrypt(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            byte[] payload = Base64.getDecoder().decode(value);
            ByteBuffer buffer = ByteBuffer.wrap(payload);
            byte[] iv = new byte[IV_LENGTH];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to decrypt generated login credential.", ex);
        }
    }
}
