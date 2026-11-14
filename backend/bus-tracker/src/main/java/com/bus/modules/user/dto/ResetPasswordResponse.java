package com.bus.modules.user.dto;

public record ResetPasswordResponse(String loginId, String temporaryPassword) {
}
