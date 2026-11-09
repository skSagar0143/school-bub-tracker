package com.bus.modules.trips.entity;

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
@Table(name = "trip_stops", uniqueConstraints = {
    @UniqueConstraint(name = "uk_trip_route_stop", columnNames = {"trip_id", "route_stop_id"})
}, indexes = @Index(name = "idx_trip_stop_trip_order", columnList = "trip_id,stop_order"))
public class TripStopEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @Column(name = "route_stop_id", nullable = false)
    private Long routeStopId;

    @Column(name = "stop_name", nullable = false, length = 150)
    private String stopName;

    @Column(name = "stop_address", length = 500)
    private String stopAddress;

    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder;

    private Double latitude;
    private Double longitude;

    @Column(name = "estimated_arrival_time")
    private LocalTime estimatedArrivalTime;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt;

    @Column(name = "departed_at")
    private LocalDateTime departedAt;

    @Column(length = 300)
    private String remarks;

    @PrePersist
    protected void onCreate() {
        if (status == null || status.isBlank()) status = "PENDING";
    }
}
