package com.bus.modules.school.application.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.common.exception.ResourceNotFoundException;
import com.bus.modules.school.application.SchoolPersistencePort;
import com.bus.modules.school.application.SchoolService;
import com.bus.modules.school.domain.School;
import com.bus.modules.school.domain.SchoolStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SchoolServiceImpl implements SchoolService {

    private final SchoolPersistencePort schoolPersistencePort;

    @Override
    public School createSchool(School school) {
        if (!schoolPersistencePort.findAll().isEmpty()) {
            throw new IllegalStateException("A school is already configured for this single-school installation.");
        }
        if (schoolPersistencePort.existsByCode(school.code())) {
            throw new IllegalArgumentException("School code already exists.");
        }
        return schoolPersistencePort.save(school);
    }

    @Override
    @Transactional(readOnly = true)
    public List<School> getAllSchools() {
        return schoolPersistencePort.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public School getSchoolById(Long id) {
        return schoolPersistencePort.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("School not found with id: " + id));
    }

    @Override
    public School updateSchool(Long id, School school) {
        School existing = getSchoolById(id);
        if (!existing.code().equals(school.code()) && schoolPersistencePort.existsByCode(school.code())) {
            throw new IllegalArgumentException("School code already exists.");
        }
        School updated = new School(existing.id(), school.name(), school.code(), school.email(),
                school.phone(), school.website(), school.addressLine1(), school.addressLine2(),
                school.city(), school.state(), school.pincode(), school.country(),
                existing.status(), existing.createdAt(), existing.updatedAt());
        return schoolPersistencePort.save(updated);
    }

    @Override
    public School updateSchoolStatus(Long id, SchoolStatus status) {
        School existing = getSchoolById(id);
        School updated = new School(existing.id(), existing.name(), existing.code(), existing.email(),
                existing.phone(), existing.website(), existing.addressLine1(), existing.addressLine2(),
                existing.city(), existing.state(), existing.pincode(), existing.country(),
                status, existing.createdAt(), existing.updatedAt());
        return schoolPersistencePort.save(updated);
    }
}
