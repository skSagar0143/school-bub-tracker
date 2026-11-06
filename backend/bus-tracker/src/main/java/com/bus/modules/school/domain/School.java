package com.bus.modules.school.domain;

import java.time.LocalDateTime;

public record School(
        Long id, String name, String code, String email, String phone, String website,
        String addressLine1, String addressLine2, String city, String state,
        String pincode, String country, SchoolStatus status,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {
}
