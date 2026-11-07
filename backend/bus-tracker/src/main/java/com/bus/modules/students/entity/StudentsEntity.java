
package com.bus.modules.students.entity;

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
@Table(name = "students", uniqueConstraints = {
		@UniqueConstraint(name = "uk_school_admission_number", columnNames = { "school_id", "admission_number" }) })
public class StudentsEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// School information
	@Column(name = "school_id", nullable = false)
	private Long schoolId;

	// Student personal information
	@Column(name = "first_name", nullable = false, length = 100)
	private String firstName;

	@Column(name = "last_name", length = 100)
	private String lastName;

	@Column(name = "admission_number", nullable = false, length = 50)
	private String admissionNumber;

	@Column(name = "date_of_birth")
	private LocalDate dateOfBirth;

	@Column(length = 20)
	private String gender;

	// Academic information
	@Column(name = "class_name", nullable = false, length = 50)
	private String className;

	@Column(length = 20)
	private String section;

	@Column(name = "roll_number", length = 30)
	private String rollNumber;

	// Parent / Guardian information
	@Column(name = "parent_name", nullable = false, length = 150)
	private String parentName;

	@Column(name = "parent_phone", nullable = false, length = 15)
	private String parentPhone;

	@Column(name = "parent_email", length = 150)
	private String parentEmail;

	@Column(name = "emergency_contact", length = 15)
	private String emergencyContact;

	// Address
	@Column(length = 500)
	private String address;

	// Account status
	@Column(nullable = false, length = 20)
	private String status = "ACTIVE";

	// Audit information
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
		updatedAt = LocalDateTime.now();
	}

	@PreUpdate
	protected void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
