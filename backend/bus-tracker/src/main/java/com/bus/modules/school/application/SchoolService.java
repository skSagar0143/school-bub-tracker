package com.bus.modules.school.application;

import java.util.List;

import com.bus.modules.school.domain.School;
import com.bus.modules.school.domain.SchoolStatus;

public interface SchoolService {

    School createSchool(School school);

    List<School> getAllSchools();

    School getSchoolById(Long id);

    School updateSchool(Long id, School school);

    School updateSchoolStatus(Long id, SchoolStatus status);
}
