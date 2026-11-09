package com.bus.modules.drivers.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

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
@Table(name = "drivers", uniqueConstraints = {
		@UniqueConstraint(name = "uk_driver_school_code", columnNames = { "school_id", "driver_code" }),
		@UniqueConstraint(name = "uk_driver_license", columnNames = { "license_number" }) })
public class DriversEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", unique = true)
	private UUID userId;

	@Column(name = "school_id", nullable = false)
	private Long schoolId;

	@Column(name = "driver_code", nullable = false, length = 50)
	private String driverCode;

	@Column(name = "first_name", nullable = false, length = 100)
	private String firstName;

	@Column(name = "last_name", nullable = false, length = 100)
	private String lastName;

	@Column(name = "date_of_birth")
	private LocalDate dateOfBirth;

	@Column(length = 20)
	private String gender;

	@Column(nullable = false, length = 20)
	private String phone;

	@Column(name = "alternate_phone", length = 20)
	private String alternatePhone;

	@Column(length = 150)
	private String email;

	@Column(columnDefinition = "TEXT")
	private String address;

	@Column(length = 100)
	private String city;

	@Column(length = 100)
	private String state;

	@Column(length = 15)
	private String pincode;

	@Column(name = "license_number", nullable = false, length = 50)
	private String licenseNumber;

	@Column(name = "license_type", length = 50)
	private String licenseType;

	@Column(name = "license_expiry_date")
	private LocalDate licenseExpiryDate;

	@Column(name = "joining_date")
	private LocalDate joiningDate;

	@Column(name = "emergency_contact_name", length = 150)
	private String emergencyContactName;

	@Column(name = "emergency_contact_phone", length = 20)
	private String emergencyContactPhone;

	@Column(nullable = false, length = 20)
	private String status = "ACTIVE";

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@PrePersist
	public void onCreate() {
		LocalDateTime now = LocalDateTime.now();
		createdAt = now;
		updatedAt = now;

		if (status == null || status.isBlank()) {
			status = "ACTIVE";
		}
	}

	@PreUpdate
	public void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}