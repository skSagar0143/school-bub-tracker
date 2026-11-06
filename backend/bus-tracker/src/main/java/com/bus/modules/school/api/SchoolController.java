package com.bus.modules.school.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

import com.bus.modules.school.api.dto.request.SchoolCreateRequest;
import com.bus.modules.school.api.dto.request.SchoolStatusRequest;
import com.bus.modules.school.api.dto.request.SchoolUpdateRequest;
import com.bus.modules.school.api.dto.response.SchoolResponse;
import com.bus.modules.school.application.SchoolService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/schools")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolResponse createSchool(@Valid @RequestBody SchoolCreateRequest request) {
        return SchoolResponse.from(schoolService.createSchool(request.toDomain()));
    }

    @GetMapping
    public List<SchoolResponse> getAllSchools() {
        return schoolService.getAllSchools().stream().map(SchoolResponse::from).toList();
    }

    @GetMapping("/{id}")
    public SchoolResponse getSchoolById(@PathVariable Long id) {
        return SchoolResponse.from(schoolService.getSchoolById(id));
    }

    @PutMapping("/{id}")
    public SchoolResponse updateSchool(
            @PathVariable Long id,
            @Valid @RequestBody SchoolUpdateRequest request) {
        return SchoolResponse.from(schoolService.updateSchool(id, request.toDomain()));
    }

    @PatchMapping("/{id}/status")
    public SchoolResponse updateSchoolStatus(
            @PathVariable Long id,
            @Valid @RequestBody SchoolStatusRequest request) {
        return SchoolResponse.from(schoolService.updateSchoolStatus(id, request.status()));
    }
}
