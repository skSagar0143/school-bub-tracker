package com.bus.modules.tripschedules.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "trip_schedules", indexes = {
		@Index(name = "idx_trip_schedule_school_status", columnList = "school_id,status"),
		@Index(name = "idx_trip_schedule_assignment_type", columnList = "bus_assignment_id,trip_type,status") })
@Getter
@Setter
@NoArgsConstructor
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

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		LocalDateTime now = LocalDateTime.now();
		createdAt = now;
		updatedAt = now;
		if (status == null || status.isBlank())
			status = "ACTIVE";
	}

	@PreUpdate
	protected void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
