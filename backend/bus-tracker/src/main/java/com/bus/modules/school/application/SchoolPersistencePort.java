package com.bus.modules.school.application;

import java.util.List;
import java.util.Optional;

import com.bus.modules.school.domain.School;

public interface SchoolPersistencePort {
    School save(School school);
    Optional<School> findById(Long id);
    List<School> findAll();
    boolean existsByCode(String code);
}
