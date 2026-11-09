package com.bus.modules.studenttransportassignments.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "student_transport_assignments", indexes = {
        @Index(name = "idx_student_transport_student_status", columnList = "student_id,status"),
        @Index(name = "idx_student_transport_route_status", columnList = "route_id,status")
})
public class StudentTransportAssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "route_id", nullable = false)
    private Long routeId;

    @Column(name = "requires_pickup", nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean requiresPickup = true;

    @Column(name = "requires_drop", nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean requiresDrop = true;

    @Column(name = "pickup_stop_id", nullable = false)
    private Long pickupStopId;

    @Column(name = "drop_stop_id", nullable = false)
    private Long dropStopId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(length = 500)
    private String remarks;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null || status.isBlank()) {
            status = "ACTIVE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}