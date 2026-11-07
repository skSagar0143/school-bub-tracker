
package com.bus.modules.busses.entity;

import java.time.LocalDate;
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
@Table(name = "busses", uniqueConstraints = {
		@UniqueConstraint(name = "uk_bus_school_number", columnNames = { "school_id", "bus_number" }),
		@UniqueConstraint(name = "uk_bus_registration_number", columnNames = { "registration_number" }) })
public class BusEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "school_id", nullable = false)
	private Long schoolId;

	@Column(name = "bus_number", nullable = false, length = 50)
	private String busNumber;

	@Column(name = "registration_number", nullable = false, length = 30)
	private String registrationNumber;

	@Column(length = 100)
	private String model;

	@Column(nullable = false)
	private Integer capacity;

	@Column(name = "bus_type", length = 30)
	private String busType;

	@Column(name = "fuel_type", length = 30)
	private String fuelType;

	@Column(name = "manufacture_year")
	private Integer manufactureYear;

	@Column(name = "insurance_number", length = 100)
	private String insuranceNumber;

	@Column(name = "insurance_expiry_date")
	private LocalDate insuranceExpiryDate;

	@Column(name = "fitness_expiry_date")
	private LocalDate fitnessExpiryDate;

	@Column(length = 20, nullable = false)
	private String status = "ACTIVE";

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
