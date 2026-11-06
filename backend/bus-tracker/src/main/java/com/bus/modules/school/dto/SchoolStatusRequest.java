package com.bus.modules.school.dto;

import com.bus.modules.school.entity.SchoolStatus;
import jakarta.validation.constraints.NotNull;

public record SchoolStatusRequest(@NotNull SchoolStatus status) {
}
