package com.bus.modules.identity.application;

public class IdentityException extends RuntimeException {
    private final int status;

    public IdentityException(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }

    public static IdentityException unauthorized() {
        return new IdentityException("Invalid email or password", 401);
    }
}
