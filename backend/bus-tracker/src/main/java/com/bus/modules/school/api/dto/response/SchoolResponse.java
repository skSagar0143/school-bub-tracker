package com.bus.modules.school.api.dto.response;

import java.time.LocalDateTime;

import com.bus.modules.school.domain.School;
import com.bus.modules.school.domain.SchoolStatus;

public record SchoolResponse(
        Long id,
        String name,
        String code,
        String email,
        String phone,
        String website,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String pincode,
        String country,
        SchoolStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static SchoolResponse from(School school) {
        return new SchoolResponse(
                school.id(), school.name(), school.code(), school.email(),
                school.phone(), school.website(), school.addressLine1(),
                school.addressLine2(), school.city(), school.state(),
                school.pincode(), school.country(), school.status(),
                school.createdAt(), school.updatedAt()
        );
    }
}
