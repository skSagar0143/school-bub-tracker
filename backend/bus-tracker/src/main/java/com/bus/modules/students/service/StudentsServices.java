
package com.bus.modules.students.service;

import java.util.List;

import com.bus.modules.students.entity.StudentsEntity;

public interface StudentsServices {

	StudentsEntity createStudent(StudentsEntity student);

	StudentsEntity updateStudent(Long id, StudentsEntity student);

	StudentsEntity getStudentById(Long id);

	List<StudentsEntity> getAllStudents();

	List<StudentsEntity> getStudentsBySchoolId(Long schoolId);

	void deleteStudent(Long id);

}
