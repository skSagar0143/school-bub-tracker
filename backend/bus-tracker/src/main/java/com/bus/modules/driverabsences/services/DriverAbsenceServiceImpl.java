package com.bus.modules.driverabsences.services;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.driverabsences.entity.DriverAbsenceEntity;
import com.bus.modules.driverabsences.repository.DriverAbsenceRepository;
import com.bus.modules.drivers.entity.DriversEntity;
import com.bus.modules.drivers.repository.DriversRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DriverAbsenceServiceImpl implements DriverAbsenceService {

    private final DriverAbsenceRepository absenceRepository;
    private final DriversRepository driversRepository;

    @Override
    public DriverAbsenceEntity markAbsent(Long driverId, Long schoolId, LocalDate startDate,
                                          LocalDate endDate, String reason) {
        if (startDate == null || endDate == null || endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Please provide a valid absence date range.");
        }

        DriversEntity driver = driversRepository.findById(driverId)
            .orElseThrow(() -> new IllegalArgumentException("Driver not found."));
        if (!driver.getSchoolId().equals(schoolId) || !"ACTIVE".equals(driver.getStatus())) {
            throw new IllegalArgumentException("Only an active driver belonging to this school can be marked absent.");
        }

        if (absenceRepository.existsOverlappingAbsence(driverId, startDate, endDate)) {
            throw new IllegalArgumentException("This driver already has an absence overlapping the selected dates.");
        }

        DriverAbsenceEntity absence = new DriverAbsenceEntity();
        absence.setSchoolId(schoolId);
        absence.setDriverId(driverId);
        absence.setStartDate(startDate);
        absence.setEndDate(endDate);
        absence.setReason(reason == null || reason.isBlank() ? null : reason.trim());
        absence.setStatus("ACTIVE");
        return absenceRepository.save(absence);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverAbsenceEntity> getDriverAbsences(Long driverId) {
        return absenceRepository.findByDriverIdOrderByStartDateDesc(driverId);
    }
}
