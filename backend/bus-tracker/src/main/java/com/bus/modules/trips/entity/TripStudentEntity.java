package com.bus.modules.trips.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "trip_students", uniqueConstraints = {
    @UniqueConstraint(name = "uk_trip_transport_assignment", columnNames = {"trip_id", "student_transport_assignment_id"})
}, indexes = @Index(name = "idx_trip_student_trip_status", columnList = "trip_id,status"))
public class TripStudentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @Column(name = "student_transport_assignment_id", nullable = false)
    private Long studentTransportAssignmentId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "stop_id", nullable = false)
    private Long stopId;

    @Column(name = "stop_name", nullable = false, length = 150)
    private String stopName;

    @Column(name = "student_name", nullable = false, length = 201)
    private String studentName;

    @Column(name = "admission_number", nullable = false, length = 50)
    private String admissionNumber;

    @Column(name = "class_name", length = 50)
    private String className;

    @Column(name = "section", length = 20)
    private String section;

    @Column(nullable = false, length = 20)
    private String status = "WAITING";

    @Column(name = "boarded_at")
    private LocalDateTime boardedAt;

    @Column(name = "dropped_at")
    private LocalDateTime droppedAt;

    @Column(length = 300)
    private String remarks;

    @PrePersist
    protected void onCreate() {
        if (status == null || status.isBlank()) status = "WAITING";
    }
}
