package com.bus.modules.busassignmentstops.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "bus_assignment_stops", uniqueConstraints = {
        @UniqueConstraint(name = "uk_bus_assignment_route_stop",
                columnNames = { "bus_assignment_id", "route_stop_id" })
})
public class BusAssignmentStopEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bus_assignment_id", nullable = false)
    private Long busAssignmentId;

    @Column(name = "route_stop_id", nullable = false)
    private Long routeStopId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
