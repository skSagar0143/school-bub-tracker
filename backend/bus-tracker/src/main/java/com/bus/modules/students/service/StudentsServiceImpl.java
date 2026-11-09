package com.bus.modules.students.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.students.entity.StudentsEntity;
import com.bus.modules.students.repository.StudentsRepository;
import com.bus.modules.school.entity.School;
import com.bus.modules.school.entity.SchoolStatus;
import com.bus.modules.school.repository.SchoolRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class StudentsServiceImpl implements StudentsServices {

	private final StudentsRepository studentsRepository;
	private final SchoolRepository schoolRepository;

	@Override
	public StudentsEntity createStudent(StudentsEntity student) {
		if (isSchoolAdmin()) {
			student.setSchoolId(getSchoolAdminSchoolId());
		}
		if (studentsRepository.existsBySchoolIdAndAdmissionNumber(student.getSchoolId(),
				student.getAdmissionNumber())) {
			throw new RuntimeException("Admission number already exists");
		}
		return studentsRepository.save(student);
	}

	@Override
	public StudentsEntity updateStudent(Long id, StudentsEntity student) {
		StudentsEntity existingStudent = getStudentById(id);

		if (isSchoolAdmin()) {
			student.setSchoolId(existingStudent.getSchoolId());
		}

		boolean duplicate = studentsRepository.existsBySchoolIdAndAdmissionNumberAndIdNot(student.getSchoolId(),
				student.getAdmissionNumber(), id);

		if (duplicate) {
			throw new RuntimeException("Admission number already exists");
		}
		existingStudent.setSchoolId(student.getSchoolId());
		existingStudent.setFirstName(student.getFirstName());
		existingStudent.setLastName(student.getLastName());
		existingStudent.setAdmissionNumber(student.getAdmissionNumber());
		existingStudent.setDateOfBirth(student.getDateOfBirth());
		existingStudent.setGender(student.getGender());
		existingStudent.setClassName(student.getClassName());
		existingStudent.setSection(student.getSection());
		existingStudent.setRollNumber(student.getRollNumber());
		existingStudent.setParentName(student.getParentName());
		existingStudent.setParentPhone(student.getParentPhone());
		existingStudent.setParentEmail(student.getParentEmail());
		existingStudent.setEmergencyContact(student.getEmergencyContact());
		existingStudent.setAddress(student.getAddress());

		return studentsRepository.save(existingStudent);
	}

	@Override
	@Transactional(readOnly = true)
	public StudentsEntity getStudentById(Long id) {

		StudentsEntity student = studentsRepository.findById(id)
				.filter(item -> "ACTIVE".equals(item.getStatus()))
				.orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));

		if (isSchoolAdmin() && !getSchoolAdminSchoolId().equals(student.getSchoolId())) {
			throw new org.springframework.security.access.AccessDeniedException(
					"You cannot access students from another school.");
		}
		return student;
	}

	@Override
	@Transactional(readOnly = true)
	public List<StudentsEntity> getAllStudents() {
		if (isSchoolAdmin()) {
			return studentsRepository.findBySchoolIdAndStatus(getSchoolAdminSchoolId(), "ACTIVE");
		}
		return studentsRepository.findByStatus("ACTIVE");
	}

	@Override
	@Transactional(readOnly = true)
	public List<StudentsEntity> getStudentsBySchoolId(Long schoolId) {

		Long requestedSchoolId = isSchoolAdmin() ? getSchoolAdminSchoolId() : schoolId;
		return studentsRepository.findBySchoolIdAndStatus(requestedSchoolId, "ACTIVE");
	}

	@Override
	public void deleteStudent(Long id) {

		StudentsEntity student = getStudentById(id);
		student.setStatus("INACTIVE");

		studentsRepository.save(student);
	}

	private boolean isSchoolAdmin() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return authentication != null && authentication.getAuthorities().stream()
				.anyMatch(authority -> "ROLE_SCHOOL_ADMIN".equals(authority.getAuthority()));
	}

	/**
	 * This installation currently supports one configured school. A School Admin
	 * is therefore bound to that school on the server; the client never chooses it.
	 */
	private Long getSchoolAdminSchoolId() {
		List<School> activeSchools = schoolRepository.findAll().stream()
				.filter(school -> school.getStatus() == SchoolStatus.ACTIVE)
				.toList();
		if (activeSchools.size() != 1) {
			throw new IllegalStateException(
					"Exactly one active school must be configured for the School Admin account.");
		}
		return activeSchools.get(0).getId();
	}

}
