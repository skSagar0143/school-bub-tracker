package com.bus.modules.tripschedules.service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.busassignments.entity.BusAssignmentEntity;
import com.bus.modules.busassignments.repository.BusAssignmentRepository;
import com.bus.modules.school.repository.SchoolRepository;
import com.bus.modules.tripschedules.dto.TripScheduleRequest;
import com.bus.modules.tripschedules.entity.TripScheduleEntity;
import com.bus.modules.tripschedules.repository.TripScheduleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TripScheduleServiceImpl implements TripScheduleService {

    private static final Set<String> VALID_TRIP_TYPES = Set.of("PICKUP", "DROP");
    private static final Set<String> VALID_DAYS =
            Set.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");
    private static final Set<String> VALID_STATUSES = Set.of("ACTIVE", "INACTIVE");

    private final TripScheduleRepository scheduleRepository;
    private final BusAssignmentRepository busAssignmentRepository;
    private final SchoolRepository schoolRepository;

    @Override
    public TripScheduleEntity createSchedule(TripScheduleRequest request) {
        validateRequest(request);
        BusAssignmentEntity assignment = validateAssignment(request, null);

        TripScheduleEntity entity = new TripScheduleEntity();
        copyRequest(request, entity);
        entity.setSchoolId(assignment.getSchoolId());
        entity.setBusAssignmentId(assignment.getId());
        entity.setStatus("ACTIVE");
        return scheduleRepository.save(entity);
    }

    @Override
    public TripScheduleEntity updateSchedule(Long id, TripScheduleRequest request) {
        TripScheduleEntity entity = scheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip schedule not found."));
        validateRequest(request);
        BusAssignmentEntity assignment = validateAssignment(request, id);

        copyRequest(request, entity);
        entity.setSchoolId(assignment.getSchoolId());
        entity.setBusAssignmentId(assignment.getId());
        return scheduleRepository.save(entity);
    }

    private void validateRequest(TripScheduleRequest request) {
        if (request == null || request.schoolId() == null || request.busAssignmentId() == null
                || request.tripType() == null || request.startTime() == null
                || request.effectiveFrom() == null || request.operatingDays() == null
                || request.operatingDays().isBlank()) {
            throw new IllegalArgumentException(
                    "School, bus assignment, trip type, start time, effective-from date and operating days are required.");
        }

        if (!VALID_TRIP_TYPES.contains(request.tripType().trim().toUpperCase())) {
            throw new IllegalArgumentException("Trip type must be PICKUP or DROP.");
        }

        if (request.effectiveUntil() != null && request.effectiveUntil().isBefore(request.effectiveFrom())) {
            throw new IllegalArgumentException("Effective-until date cannot be before effective-from date.");
        }

        Set<String> days = Arrays.stream(request.operatingDays().split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toSet());

        if (days.isEmpty() || !VALID_DAYS.containsAll(days)) {
            throw new IllegalArgumentException("Select valid operating days: MON, TUE, WED, THU, FRI, SAT or SUN.");
        }

        if (request.status() != null && !request.status().isBlank()
                && !VALID_STATUSES.contains(request.status().trim().toUpperCase())) {
            throw new IllegalArgumentException("Schedule status must be ACTIVE or INACTIVE.");
        }

        if (request.remarks() != null && request.remarks().length() > 500) {
            throw new IllegalArgumentException("Remarks cannot exceed 500 characters.");
        }
    }

    private BusAssignmentEntity validateAssignment(TripScheduleRequest request, Long excludeScheduleId) {
        if (!schoolRepository.existsById(request.schoolId())) {
            throw new IllegalArgumentException("School not found.");
        }

        BusAssignmentEntity assignment = busAssignmentRepository.findById(request.busAssignmentId())
                .orElseThrow(() -> new IllegalArgumentException("Bus assignment not found."));

        if (!"ACTIVE".equalsIgnoreCase(assignment.getStatus())) {
            throw new IllegalArgumentException("Only an active bus assignment can have a trip schedule.");
        }

        if (!assignment.getSchoolId().equals(request.schoolId())) {
            throw new IllegalArgumentException("The bus assignment does not belong to the selected school.");
        }

        if (request.effectiveFrom().isBefore(assignment.getStartDate())) {
            throw new IllegalArgumentException("The schedule cannot start before the bus assignment starts.");
        }

        LocalDate assignmentEnd = assignment.getEndDate();
        if (assignmentEnd != null) {
            if (request.effectiveUntil() == null || request.effectiveUntil().isAfter(assignmentEnd)) {
                throw new IllegalArgumentException(
                        "The schedule end date must be within the bus assignment period.");
            }
        }

        return assignment;
    }

    private void copyRequest(TripScheduleRequest request, TripScheduleEntity entity) {
        entity.setTripType(request.tripType().trim().toUpperCase());
        entity.setStartTime(request.startTime());
        entity.setEffectiveFrom(request.effectiveFrom());
        entity.setEffectiveUntil(request.effectiveUntil());
        entity.setOperatingDays(normalizeDays(request.operatingDays()));
        if (request.status() != null && !request.status().isBlank()) {
            entity.setStatus(request.status().trim().toUpperCase());
        }
        entity.setRemarks(request.remarks() == null || request.remarks().isBlank()
                ? null : request.remarks().trim());
    }

    private String normalizeDays(String operatingDays) {
        return Arrays.stream(operatingDays.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .distinct()
                .filter(VALID_DAYS::contains)
                .sorted((left, right) -> Integer.compare(
                        List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN").indexOf(left),
                        List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN").indexOf(right)))
                .collect(Collectors.joining(","));
    }

    @Override
    @Transactional(readOnly = true)
    public TripScheduleEntity getScheduleById(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip schedule not found."));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripScheduleEntity> getSchedulesBySchool(Long schoolId) {
        if (!schoolRepository.existsById(schoolId)) {
            throw new IllegalArgumentException("School not found.");
        }
        return scheduleRepository.findBySchoolIdOrderByStartTimeAsc(schoolId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripScheduleEntity> getSchedulesByBusAssignment(Long busAssignmentId) {
        if (!busAssignmentRepository.existsById(busAssignmentId)) {
            throw new IllegalArgumentException("Bus assignment not found.");
        }
        return scheduleRepository.findByBusAssignmentIdOrderByStartTimeAsc(busAssignmentId);
    }

    @Override
    public void deactivateSchedule(Long id) {
        TripScheduleEntity entity = getScheduleById(id);
        entity.setStatus("INACTIVE");
        scheduleRepository.save(entity);
    }
}
