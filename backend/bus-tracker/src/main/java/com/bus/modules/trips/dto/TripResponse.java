package com.bus.modules.trips.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import com.bus.modules.trips.entity.TripEntity;

public record TripResponse(
    Long id, Long schoolId, Long tripScheduleId, Long busAssignmentId, Long busId, Long routeId,
    Long driverAssignmentId, Long driverId, LocalDate tripDate, String tripType,
    LocalTime scheduledStartTime, LocalDateTime actualStartAt, LocalDateTime actualEndAt,
    String status, String remarks, List<TripStopResponse> stops, List<TripStudentResponse> students
) {
    public static TripResponse from(TripEntity e, List<TripStopResponse> stops, List<TripStudentResponse> students) {
        return new TripResponse(e.getId(), e.getSchoolId(), e.getTripScheduleId(), e.getBusAssignmentId(),
            e.getBusId(), e.getRouteId(), e.getDriverAssignmentId(), e.getDriverId(), e.getTripDate(),
            e.getTripType(), e.getScheduledStartTime(), e.getActualStartAt(), e.getActualEndAt(),
            e.getStatus(), e.getRemarks(), stops, students);
    }
}
