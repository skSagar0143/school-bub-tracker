package com.bus.modules.livetracking.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "bus_location_history", indexes = {
		@Index(name = "idx_location_trip_time", columnList = "trip_id, recorded_at"),
		@Index(name = "idx_location_school_trip", columnList = "school_id, trip_id"),
		@Index(name = "idx_location_bus_time", columnList = "bus_id, recorded_at") })
public class BusLocationEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "school_id", nullable = false)
	private Long schoolId;

	@Column(name = "trip_id", nullable = false)
	private Long tripId;

	@Column(name = "bus_id", nullable = false)
	private Long busId;

	@Column(name = "driver_id", nullable = false)
	private Long driverId;

	@Column(name = "latitude", nullable = false, precision = 10, scale = 7)
	private BigDecimal latitude;

	@Column(name = "longitude", nullable = false, precision = 10, scale = 7)
	private BigDecimal longitude;

	// GPS accuracy in meters
	@Column(name = "accuracy")
	private Double accuracy;

	// Speed in meters per second
	@Column(name = "speed")
	private Double speed;

	// Direction in degrees (0-360)
	@Column(name = "heading")
	private Double heading;

	// Timestamp reported by the driver's device
	@Column(name = "recorded_at", nullable = false)
	private LocalDateTime recordedAt;

	// Timestamp when our backend receives the location
	@Column(name = "received_at", nullable = false)
	private LocalDateTime receivedAt;

	@PrePersist
	protected void onCreate() {
		if (receivedAt == null) {
			receivedAt = LocalDateTime.now();
		}
	}
}
