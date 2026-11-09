package com.bus.modules.tripschedules.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record TripScheduleRequest(
        Long schoolId,
        Long busAssignmentId,
        String tripType,
        LocalTime startTime,
        LocalDate effectiveFrom,
        LocalDate effectiveUntil,
        String operatingDays,
        String status,
        String remarks
) {
}
