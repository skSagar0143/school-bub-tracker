package com.bus.modules.school.api.dto.request;

import com.bus.modules.school.domain.SchoolStatus;

import jakarta.validation.constraints.NotNull;

public record SchoolStatusRequest(@NotNull SchoolStatus status) {
}
