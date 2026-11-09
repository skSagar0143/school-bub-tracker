package com.bus.modules.driverabsences.services;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.driverabsences.entity.DriverAbsenceEntity;
import com.bus.modules.driverabsences.repository.DriverAbsenceRepository;
import com.bus.modules.driverassignments.repository.DriverAssignmentRepository;
import com.bus.modules.trips.entity.TripEntity;
import com.bus.modules.trips.repository.TripRepository;
import com.bus.modules.drivers.entity.DriversEntity;
import com.bus.modules.drivers.repository.DriversRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DriverAbsenceServiceImpl implements DriverAbsenceService {

    private final DriverAbsenceRepository absenceRepository;
    private final DriversRepository driversRepository;
    private final DriverAssignmentRepository driverAssignmentRepository;
    private final TripRepository tripRepository;

    @Override
    public DriverAbsenceEntity markAbsent(Long driverId, Long schoolId, LocalDate startDate,
                                          LocalDate endDate, String reason, Long replacementDriverId) {
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

        if (replacementDriverId == null || replacementDriverId.equals(driverId)) {
            throw new IllegalArgumentException("Select a different active replacement driver.");
        }
        DriversEntity replacement = driversRepository.findById(replacementDriverId)
            .orElseThrow(() -> new IllegalArgumentException("Replacement driver not found."));
        if (!replacement.getSchoolId().equals(schoolId) || !"ACTIVE".equals(replacement.getStatus())) {
            throw new IllegalArgumentException("Replacement driver must be active and belong to this school.");
        }
        if (absenceRepository.existsOverlappingAbsence(replacementDriverId, startDate, endDate)) {
            throw new IllegalArgumentException("Replacement driver is absent during the selected dates.");
        }
        if (driverAssignmentRepository.existsOverlappingActiveAssignmentForDriver(
                replacementDriverId, startDate, endDate, null)) {
            throw new IllegalArgumentException("Replacement driver already has another active bus assignment during these dates.");
        }

        List<TripEntity> activeTrips = tripRepository.findBySchoolIdAndDriverIdAndTripDateBetweenAndStatus(
            schoolId, driverId, startDate, endDate, "IN_PROGRESS");
        if (!activeTrips.isEmpty()) {
            throw new IllegalArgumentException("This driver has an in-progress trip during the selected dates. Complete the trip or use the active-trip transfer workflow before recording this absence.");
        }

        DriverAbsenceEntity absence = new DriverAbsenceEntity();
        absence.setSchoolId(schoolId);
        absence.setDriverId(driverId);
        absence.setReplacementDriverId(replacementDriverId);
        absence.setStartDate(startDate);
        absence.setEndDate(endDate);
        absence.setReason(reason == null || reason.isBlank() ? null : reason.trim());
        absence.setStatus("ACTIVE");
        absence = absenceRepository.save(absence);

        List<TripEntity> scheduledTrips = tripRepository.findBySchoolIdAndDriverIdAndTripDateBetweenAndStatus(
            schoolId, driverId, startDate, endDate, "SCHEDULED");
        scheduledTrips.forEach(trip -> trip.setDriverId(replacementDriverId));
        tripRepository.saveAll(scheduledTrips);
        return absence;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriverAbsenceEntity> getDriverAbsences(Long driverId) {
        return absenceRepository.findByDriverIdOrderByStartDateDesc(driverId);
    }
}
