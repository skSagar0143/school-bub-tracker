package com.bus.modules.students.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.students.entity.StudentsEntity;
import com.bus.modules.students.repository.StudentsRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class StudentsServiceImpl implements StudentsServices {

	private final StudentsRepository studentsRepository;

	@Override
	public StudentsEntity createStudent(StudentsEntity student) {
		if (studentsRepository.existsBySchoolIdAndAdmissionNumber(student.getSchoolId(),
				student.getAdmissionNumber())) {
			throw new RuntimeException("Admission number already exists");
		}
		return studentsRepository.save(student);
	}

	@Override
	public StudentsEntity updateStudent(Long id, StudentsEntity student) {
		StudentsEntity existingStudent = getStudentById(id);

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

		return studentsRepository.findById(id).filter(student -> "ACTIVE".equals(student.getStatus()))
				.orElseThrow(() -> new RuntimeException("Student not found with ID: " + id));
	}

	@Override
	@Transactional(readOnly = true)
	public List<StudentsEntity> getAllStudents() {
		return studentsRepository.findByStatus("ACTIVE");
	}

	@Override
	@Transactional(readOnly = true)
	public List<StudentsEntity> getStudentsBySchoolId(Long schoolId) {

		return studentsRepository.findBySchoolIdAndStatus(schoolId, "ACTIVE");
	}

	@Override
	public void deleteStudent(Long id) {

		StudentsEntity student = getStudentById(id);
		student.setStatus("INACTIVE");

		studentsRepository.save(student);
	}

}
