package com.bus.modules.livetracking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LiveLocationResponse(
        Long tripId,
        Long busId,
        BigDecimal latitude,
        BigDecimal longitude,
        Double accuracy,
        Double speed,
        Double heading,
        LocalDateTime recordedAt,
        boolean historySaved,
        String message) {
}
