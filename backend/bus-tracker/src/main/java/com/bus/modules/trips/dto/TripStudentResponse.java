package com.bus.modules.trips.dto;

import java.time.LocalDateTime;
import com.bus.modules.trips.entity.TripStudentEntity;

public record TripStudentResponse(
    Long id, Long studentTransportAssignmentId, Long studentId, String studentName,
    String admissionNumber, String className, String section, Long stopId, String stopName,
    String status, LocalDateTime boardedAt, LocalDateTime droppedAt, String remarks
) {
    public static TripStudentResponse from(TripStudentEntity e) {
        return new TripStudentResponse(e.getId(), e.getStudentTransportAssignmentId(), e.getStudentId(),
            e.getStudentName(), e.getAdmissionNumber(), e.getClassName(), e.getSection(),
            e.getStopId(), e.getStopName(), e.getStatus(), e.getBoardedAt(), e.getDroppedAt(), e.getRemarks());
    }
}
