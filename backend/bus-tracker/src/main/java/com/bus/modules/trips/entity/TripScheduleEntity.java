
package com.bus.modules.trips.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "trip_schedules")
public class TripScheduleEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "school_id", nullable = false)
	private Long schoolId;

	@Column(name = "bus_assignment_id", nullable = false)
	private Long busAssignmentId;

	@Column(name = "trip_type", nullable = false, length = 20)
	private String tripType;

	@Column(name = "start_time", nullable = false)
	private LocalTime startTime;

	@Column(name = "effective_from", nullable = false)
	private LocalDate effectiveFrom;

	@Column(name = "effective_until")
	private LocalDate effectiveUntil;

	@Column(name = "operating_days", nullable = false, length = 30)
	private String operatingDays;

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
