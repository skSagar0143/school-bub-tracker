package com.bus.modules.trips.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "trips", uniqueConstraints = {
    @UniqueConstraint(name = "uk_trip_schedule_date", columnNames = {"trip_schedule_id", "trip_date"})
}, indexes = {
    @Index(name = "idx_trip_school_date", columnList = "school_id,trip_date"),
    @Index(name = "idx_trip_bus_date", columnList = "bus_id,trip_date")
})
public class TripEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "trip_schedule_id", nullable = false)
    private Long tripScheduleId;

    @Column(name = "bus_assignment_id", nullable = false)
    private Long busAssignmentId;

    @Column(name = "bus_id", nullable = false)
    private Long busId;

    @Column(name = "route_id", nullable = false)
    private Long routeId;

    @Column(name = "driver_assignment_id")
    private Long driverAssignmentId;

    @Column(name = "driver_id")
    private Long driverId;

    @Column(name = "trip_date", nullable = false)
    private LocalDate tripDate;

    @Column(name = "trip_type", nullable = false, length = 20)
    private String tripType;

    @Column(name = "scheduled_start_time", nullable = false)
    private LocalTime scheduledStartTime;

    @Column(name = "actual_start_at")
    private LocalDateTime actualStartAt;

    @Column(name = "actual_end_at")
    private LocalDateTime actualEndAt;

    @Column(nullable = false, length = 20)
    private String status = "SCHEDULED";

    @Column(length = 500)
    private String remarks;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null || status.isBlank()) status = "SCHEDULED";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
