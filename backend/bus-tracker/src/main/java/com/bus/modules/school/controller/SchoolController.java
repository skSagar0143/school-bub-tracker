package com.bus.modules.school.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.school.dto.SchoolRequest;
import com.bus.modules.school.dto.SchoolStatusRequest;
import com.bus.modules.school.dto.SchoolResponse;
import com.bus.modules.school.service.SchoolService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/school")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SCHOOL_ADMIN')")
@Tag(name = "School", description = "School profile management")
public class SchoolController {

    private final SchoolService schoolService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create the school profile")
    public SchoolResponse createSchool(@Valid @RequestBody SchoolRequest request) {
        return SchoolResponse.from(schoolService.createSchool(request));
    }

    @GetMapping
    @Operation(summary = "Get the configured school")
    public List<SchoolResponse> getAllSchools() {
        return schoolService.getAllSchools().stream().map(SchoolResponse::from).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get school by ID")
    public SchoolResponse getSchoolById(@PathVariable Long id) {
        return SchoolResponse.from(schoolService.getSchoolById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update school details")
    public SchoolResponse updateSchool(
            @PathVariable Long id,
            @Valid @RequestBody SchoolRequest request) {
        return SchoolResponse.from(schoolService.updateSchool(id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Activate or deactivate the school")
    public SchoolResponse updateSchoolStatus(
            @PathVariable Long id,
            @Valid @RequestBody SchoolStatusRequest request) {
        return SchoolResponse.from(schoolService.updateSchoolStatus(id, request.status()));
    }
}
