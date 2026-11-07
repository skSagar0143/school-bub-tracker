
package com.bus.modules.students.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bus.modules.students.entity.StudentsEntity;
import com.bus.modules.students.service.StudentsServices;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/stu")
@RequiredArgsConstructor
public class StudentsController {

	private final StudentsServices services;

	// Create Student
	@PostMapping
	public ResponseEntity<StudentsEntity> createStudent(@Valid @RequestBody StudentsEntity student) {

		return ResponseEntity.status(HttpStatus.CREATED).body(services.createStudent(student));
	}

	// Get All Students
	@GetMapping
	public ResponseEntity<List<StudentsEntity>> getAllStudents() {

		return ResponseEntity.ok(services.getAllStudents());
	}

	// Get Student By ID
	@GetMapping("/{id}")
	public ResponseEntity<StudentsEntity> getStudentById(@PathVariable Long id) {

		return ResponseEntity.ok(services.getStudentById(id));
	}

	// Get Students By School ID
	@GetMapping("/school/{schoolId}")
	public ResponseEntity<List<StudentsEntity>> getStudentsBySchoolId(@PathVariable Long schoolId) {

		return ResponseEntity.ok(services.getStudentsBySchoolId(schoolId));
	}

	// Update Student
	@PutMapping("/{id}")
	public ResponseEntity<StudentsEntity> updateStudent(@PathVariable Long id,
			@Valid @RequestBody StudentsEntity student) {

		return ResponseEntity.ok(services.updateStudent(id, student));
	}

	// Delete Student (Soft Delete)
	@DeleteMapping("/{id}")
	public ResponseEntity<String> deleteStudent(@PathVariable Long id) {

		services.deleteStudent(id);

		return ResponseEntity.ok("Student deleted successfully");
	}
}
