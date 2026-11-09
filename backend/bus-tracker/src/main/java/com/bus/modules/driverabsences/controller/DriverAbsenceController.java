package com.bus.modules.driverabsences.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bus.modules.driverabsences.entity.DriverAbsenceEntity;
import com.bus.modules.driverabsences.services.DriverAbsenceService;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/driver-absences")
@RequiredArgsConstructor
public class DriverAbsenceController {

    private final DriverAbsenceService absenceService;

    @PostMapping("/driver/{driverId}")
    public ResponseEntity<DriverAbsenceEntity> markAbsent(
            @PathVariable Long driverId, @RequestBody MarkAbsenceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(absenceService.markAbsent(
            driverId, request.getSchoolId(), request.getStartDate(), request.getEndDate(), request.getReason()));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<DriverAbsenceEntity>> getDriverAbsences(@PathVariable Long driverId) {
        return ResponseEntity.ok(absenceService.getDriverAbsences(driverId));
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class MarkAbsenceRequest {
        private Long schoolId;
        private LocalDate startDate;
        private LocalDate endDate;
        private String reason;
    }
}
