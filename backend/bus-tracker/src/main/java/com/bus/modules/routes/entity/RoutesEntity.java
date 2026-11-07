package com.bus.modules.routes.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "routes", uniqueConstraints = {
		@UniqueConstraint(name = "uk_route_school_code", columnNames = { "school_id", "route_code" }) })
public class RoutesEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "school_id", nullable = false)
	private Long schoolId;

	@Column(name = "route_code", nullable = false, length = 50)
	private String routeCode;

	@Column(name = "route_name", nullable = false, length = 150)
	private String routeName;

	@Column(name = "description", length = 500)
	private String description;

	@Column(name = "starting_point", nullable = false, length = 200)
	private String startingPoint;

	@Column(name = "ending_point", nullable = false, length = 200)
	private String endingPoint;

	@Column(name = "estimated_distance")
	private Double estimatedDistance;

	@Column(name = "estimated_duration")
	private Integer estimatedDuration;

	@Column(name = "start_time")
	private String startTime;

	@Column(name = "end_time")
	private String endTime;

	@Column(name = "status", nullable = false, length = 20)
	private String status;

	@Column(name = "created_at", nullable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
		updatedAt = LocalDateTime.now();

		if (status == null || status.isBlank()) {
			status = "ACTIVE";
		}
	}

	@PreUpdate
	protected void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}