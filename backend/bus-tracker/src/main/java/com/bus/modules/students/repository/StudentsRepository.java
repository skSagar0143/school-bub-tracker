package com.bus.modules.students.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.students.entity.StudentsEntity;

public interface StudentsRepository extends JpaRepository<StudentsEntity, Long> {
	boolean existsBySchoolIdAndAdmissionNumber(Long schoolId, String admissionNumber);

	boolean existsBySchoolIdAndAdmissionNumberAndIdNot(Long schoolId, String admissionNumber, Long id);

	List<StudentsEntity> findByStatus(String status);

	List<StudentsEntity> findBySchoolIdAndStatus(Long schoolId, String status);
}
