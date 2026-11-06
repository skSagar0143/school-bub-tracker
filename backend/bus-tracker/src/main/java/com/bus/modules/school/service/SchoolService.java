package com.bus.modules.school.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.common.exception.ResourceNotFoundException;
import com.bus.modules.school.entity.School;
import com.bus.modules.school.entity.SchoolStatus;
import com.bus.modules.school.repository.SchoolRepository;
import com.bus.modules.school.dto.SchoolRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SchoolService {

    private final SchoolRepository schoolRepository;

    public School createSchool(SchoolRequest request) {
        if (schoolRepository.count() > 0) {
            throw new IllegalArgumentException(
                    "A school is already configured. This installation supports one school.");
        }
        if (schoolRepository.existsByCodeIgnoreCase(request.code())) {
            throw new IllegalArgumentException("School code already exists.");
        }
        School school = new School();
        copyRequest(request, school);
        school.setStatus(SchoolStatus.ACTIVE);
        return schoolRepository.save(school);
    }

    @Transactional(readOnly = true)
    public List<School> getAllSchools() {
        return schoolRepository.findAll();
    }

    @Transactional(readOnly = true)
    public School getSchoolById(Long id) {
        return schoolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("School not found with id: " + id));
    }

    public School updateSchool(Long id, SchoolRequest request) {
        School school = getSchoolById(id);
        boolean codeChanged = !school.getCode().equalsIgnoreCase(request.code());
        if (codeChanged && schoolRepository.existsByCodeIgnoreCase(request.code())) {
            throw new IllegalArgumentException("School code already exists.");
        }
        copyRequest(request, school);
        return schoolRepository.save(school);
    }

    public School updateSchoolStatus(Long id, SchoolStatus status) {
        School school = getSchoolById(id);
        school.setStatus(status);
        return schoolRepository.save(school);
    }

    private void copyRequest(SchoolRequest request, School school) {
        school.setName(request.name().trim());
        school.setCode(request.code().trim().toUpperCase());
        school.setEmail(blankToNull(request.email()));
        school.setPhone(blankToNull(request.phone()));
        school.setWebsite(blankToNull(request.website()));
        school.setAddressLine1(request.addressLine1().trim());
        school.setAddressLine2(blankToNull(request.addressLine2()));
        school.setCity(request.city().trim());
        school.setState(request.state().trim());
        school.setPincode(request.pincode().trim());
        school.setCountry(request.country().trim());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
