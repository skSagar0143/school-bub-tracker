package com.bus.modules.school.dto;

import java.time.LocalDateTime;

import com.bus.modules.school.entity.School;
import com.bus.modules.school.entity.SchoolStatus;

public record SchoolResponse(
        Long id, String name, String code, String email, String phone, String website,
        String addressLine1, String addressLine2, String city, String state,
        String pincode, String country, SchoolStatus status,
        LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public static SchoolResponse from(School school) {
        return new SchoolResponse(
                school.getId(), school.getName(), school.getCode(), school.getEmail(),
                school.getPhone(), school.getWebsite(), school.getAddressLine1(),
                school.getAddressLine2(), school.getCity(), school.getState(),
                school.getPincode(), school.getCountry(), school.getStatus(),
                school.getCreatedAt(), school.getUpdatedAt());
    }
}
