package com.bus.modules.school.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SchoolRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(max = 30) String code,
        @Email @Size(max = 150) String email,
        @Size(max = 20) String phone,
        @Size(max = 150) String website,
        @NotBlank @Size(max = 255) String addressLine1,
        @Size(max = 255) String addressLine2,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String state,
        @NotBlank @Size(max = 10) String pincode,
        @NotBlank @Size(max = 100) String country
) {
}
