package com.bus.modules.tripschedules.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.bus.modules.tripschedules.entity.TripScheduleEntity;

public record TripScheduleResponse(
        Long id,
        Long schoolId,
        Long busAssignmentId,
        String tripType,
        LocalTime startTime,
        LocalDate effectiveFrom,
        LocalDate effectiveUntil,
        String operatingDays,
        String status,
        String remarks,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static TripScheduleResponse from(TripScheduleEntity entity) {
        return new TripScheduleResponse(
                entity.getId(),
                entity.getSchoolId(),
                entity.getBusAssignmentId(),
                entity.getTripType(),
                entity.getStartTime(),
                entity.getEffectiveFrom(),
                entity.getEffectiveUntil(),
                entity.getOperatingDays(),
                entity.getStatus(),
                entity.getRemarks(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
