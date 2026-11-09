package com.bus.modules.trips.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.busses.entity.BusEntity;
import com.bus.modules.busses.repository.BusRepository;
import com.bus.modules.busassignments.entity.BusAssignmentEntity;
import com.bus.modules.busassignments.repository.BusAssignmentRepository;
import com.bus.modules.busassignmentstops.entity.BusAssignmentStopEntity;
import com.bus.modules.busassignmentstops.repository.BusAssignmentStopRepository;
import com.bus.modules.driverabsences.entity.DriverAbsenceEntity;
import com.bus.modules.driverabsences.repository.DriverAbsenceRepository;
import com.bus.modules.driverassignments.entity.DriverAssignmentEntity;
import com.bus.modules.driverassignments.repository.DriverAssignmentRepository;
import com.bus.modules.drivers.entity.DriversEntity;
import com.bus.modules.drivers.repository.DriversRepository;
import com.bus.modules.routes.entity.RoutesEntity;
import com.bus.modules.routes.repository.RouteRepository;
import com.bus.modules.routestops.entity.RouteStopsEntity;
import com.bus.modules.routestops.repository.RouteStopsRepository;
import com.bus.modules.school.repository.SchoolRepository;
import com.bus.modules.students.entity.StudentsEntity;
import com.bus.modules.students.repository.StudentsRepository;
import com.bus.modules.studenttransportassignments.entity.StudentTransportAssignmentEntity;
import com.bus.modules.studenttransportassignments.repository.StudentTransportAssignmentRepository;
import com.bus.modules.trips.dto.GenerateTripsRequest;
import com.bus.modules.trips.dto.TripResponse;
import com.bus.modules.trips.dto.TripStopResponse;
import com.bus.modules.trips.dto.TripStudentResponse;
import com.bus.modules.trips.dto.UpdateTripChildStatusRequest;
import com.bus.modules.trips.dto.UpdateTripStatusRequest;
import com.bus.modules.trips.entity.TripEntity;
import com.bus.modules.trips.entity.TripStopEntity;
import com.bus.modules.trips.entity.TripStudentEntity;
import com.bus.modules.trips.repository.TripRepository;
import com.bus.modules.trips.repository.TripStopRepository;
import com.bus.modules.trips.repository.TripStudentRepository;
import com.bus.modules.tripschedules.entity.TripScheduleEntity;
import com.bus.modules.tripschedules.repository.TripScheduleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TripServiceImpl implements TripService {

    private static final Set<String> TRIP_STATUSES = Set.of("SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED");
    private final TripRepository tripRepository;
    private final TripStopRepository tripStopRepository;
    private final TripStudentRepository tripStudentRepository;
    private final TripScheduleRepository scheduleRepository;
    private final BusAssignmentRepository busAssignmentRepository;
    private final BusAssignmentStopRepository assignmentStopRepository;
    private final RouteStopsRepository routeStopsRepository;
    private final StudentTransportAssignmentRepository transportAssignmentRepository;
    private final StudentsRepository studentsRepository;
    private final DriverAssignmentRepository driverAssignmentRepository;
    private final DriversRepository driversRepository;
    private final DriverAbsenceRepository driverAbsenceRepository;
    private final RouteRepository routeRepository;
    private final BusRepository busRepository;
    private final SchoolRepository schoolRepository;

    @Override
    public List<TripResponse> generateTrips(GenerateTripsRequest request) {
        if (request == null || request.schoolId() == null || request.tripDate() == null) {
            throw new IllegalArgumentException("School and trip date are required.");
        }
        if (!schoolRepository.existsById(request.schoolId())) {
            throw new IllegalArgumentException("School not found.");
        }

        LocalDate date = request.tripDate();
        String day = dayCode(date.getDayOfWeek());
        List<TripScheduleEntity> schedules =
                scheduleRepository.findBySchoolIdAndStatusOrderByStartTimeAsc(request.schoolId(), "ACTIVE");
        List<TripResponse> generated = new ArrayList<>();

        for (TripScheduleEntity schedule : schedules) {
            if (!isScheduleOperating(schedule, date, day)) continue;

            // Serialize generation for this bus assignment. The row lock ensures that
            // concurrent requests cannot both pass the duplicate-trip check.
            BusAssignmentEntity assignment = busAssignmentRepository.findByIdForUpdate(schedule.getBusAssignmentId())
                    .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                    .filter(item -> item.getSchoolId().equals(request.schoolId()))
                    .filter(item -> !item.getStartDate().isAfter(date))
                    .filter(item -> item.getEndDate() == null || !item.getEndDate().isBefore(date))
                    .orElseThrow(() -> new IllegalArgumentException(
                            "The bus assignment for schedule " + schedule.getId() + " is not active on " + date + "."));

            // A locking read is a current read under MySQL REPEATABLE_READ,
            // so it sees a trip committed by a request that held this assignment lock.
            if (!tripRepository.findExistingTripForUpdate(
                    assignment.getId(), date, schedule.getTripType()).isEmpty()) {
                continue;
            }

            BusEntity bus = busRepository.findById(assignment.getBusId())
                    .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                    .filter(item -> item.getSchoolId().equals(request.schoolId()))
                    .orElseThrow(() -> new IllegalArgumentException(
                            "The assigned bus for schedule " + schedule.getId() + " is not active."));

            List<RouteStopsEntity> routeStops = getEligibleRouteStops(assignment, schedule.getTripType());
            if (routeStops.isEmpty()) {
                throw new IllegalArgumentException("No eligible stops are configured for bus assignment "
                        + assignment.getId() + " and trip type " + schedule.getTripType() + ".");
            }

            List<DriverAssignmentEntity> activeDrivers = driverAssignmentRepository
                    .findByBusIdOrderByStartDateDesc(bus.getId()).stream()
                    .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                    .filter(item -> item.getSchoolId().equals(request.schoolId()))
                    .filter(item -> !item.getStartDate().isAfter(date))
                    .filter(item -> item.getEndDate() == null || !item.getEndDate().isBefore(date))
                    .toList();
            if (activeDrivers.size() > 1) {
                throw new IllegalStateException("More than one active driver assignment exists for bus " + bus.getBusNumber() + ".");
            }

            TripEntity trip = new TripEntity();
            trip.setSchoolId(request.schoolId());
            trip.setTripScheduleId(schedule.getId());
            trip.setBusAssignmentId(assignment.getId());
            trip.setBusId(bus.getId());
            trip.setRouteId(assignment.getRouteId());
            if (!activeDrivers.isEmpty()) {
                DriverAssignmentEntity originalAssignment = activeDrivers.get(0);
                trip.setDriverAssignmentId(originalAssignment.getId());
                Long assignedDriverId = originalAssignment.getDriverId();
                DriverAbsenceEntity absence = driverAbsenceRepository
                        .findFirstBySchoolIdAndDriverIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                                request.schoolId(), assignedDriverId, "ACTIVE", date, date)
                        .orElse(null);
                trip.setDriverId(absence != null && absence.getReplacementDriverId() != null
                        ? absence.getReplacementDriverId() : assignedDriverId);
            }
            trip.setTripDate(date);
            trip.setTripType(schedule.getTripType());
            trip.setScheduledStartTime(schedule.getStartTime());
            trip.setStatus("SCHEDULED");
            trip = tripRepository.save(trip);

            Map<Long, TripStopEntity> tripStopsByRouteStopId = new java.util.LinkedHashMap<>();
            List<TripStopEntity> tripStops = new ArrayList<>();
            for (RouteStopsEntity routeStop : routeStops) {
                TripStopEntity stop = new TripStopEntity();
                stop.setTripId(trip.getId());
                stop.setRouteStopId(routeStop.getId());
                stop.setStopName(routeStop.getStopName());
                stop.setStopAddress(routeStop.getStopAddress());
                stop.setStopOrder(routeStop.getStopOrder());
                stop.setLatitude(routeStop.getLatitude());
                stop.setLongitude(routeStop.getLongitude());
                stop.setEstimatedArrivalTime(routeStop.getEstimatedArrivalTime());
                tripStops.add(stop);
                tripStopsByRouteStopId.put(routeStop.getId(), stop);
            }
            tripStopRepository.saveAll(tripStops);

            List<TripStudentEntity> tripStudents = createTripStudents(trip, schedule.getTripType(),
                    request.schoolId(), date, tripStopsByRouteStopId);
            tripStudentRepository.saveAll(tripStudents);
            generated.add(toResponse(trip));
        }

        return generated;
    }

    private boolean isScheduleOperating(TripScheduleEntity schedule, LocalDate date, String day) {
        return !date.isBefore(schedule.getEffectiveFrom())
                && (schedule.getEffectiveUntil() == null || !date.isAfter(schedule.getEffectiveUntil()))
                && schedule.getOperatingDays() != null
                && java.util.Arrays.stream(schedule.getOperatingDays().split(","))
                        .map(String::trim)
                        .map(value -> value.toUpperCase(java.util.Locale.ROOT))
                        .anyMatch(day::equals);
    }

    private String dayCode(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "MON";
            case TUESDAY -> "TUE";
            case WEDNESDAY -> "WED";
            case THURSDAY -> "THU";
            case FRIDAY -> "FRI";
            case SATURDAY -> "SAT";
            case SUNDAY -> "SUN";
        };
    }

    private List<RouteStopsEntity> getEligibleRouteStops(BusAssignmentEntity assignment, String tripType) {
        return assignmentStopRepository.findByBusAssignmentId(assignment.getId()).stream()
                .map(BusAssignmentStopEntity::getRouteStopId)
                .map(id -> routeStopsRepository.findById(id).orElse(null))
                .filter(stop -> stop != null && "ACTIVE".equalsIgnoreCase(stop.getStatus()))
                .filter(stop -> stop.getRouteId().equals(assignment.getRouteId()))
                .filter(stop -> "PICKUP".equals(tripType) ? Boolean.TRUE.equals(stop.getPickupAllowed())
                        : Boolean.TRUE.equals(stop.getDropAllowed()))
                .sorted(Comparator.comparing(RouteStopsEntity::getStopOrder))
                .toList();
    }

    private List<TripStudentEntity> createTripStudents(TripEntity trip, String tripType, Long schoolId,
            LocalDate date, Map<Long, TripStopEntity> tripStopsByRouteStopId) {
        List<StudentTransportAssignmentEntity> assignments =
                transportAssignmentRepository.findActiveForTripGeneration(schoolId, date);
        List<TripStudentEntity> result = new ArrayList<>();

        for (StudentTransportAssignmentEntity assignment : assignments) {
            boolean matches = "PICKUP".equals(tripType)
                    ? Boolean.TRUE.equals(assignment.getRequiresPickup())
                        && trip.getBusAssignmentId().equals(assignment.getMorningBusAssignmentId())
                    : Boolean.TRUE.equals(assignment.getRequiresDrop())
                        && trip.getBusAssignmentId().equals(assignment.getAfternoonBusAssignmentId());

            if (!matches || !assignment.getSchoolId().equals(schoolId)
                    || assignment.getStartDate().isAfter(date)
                    || (assignment.getEndDate() != null && assignment.getEndDate().isBefore(date))) {
                continue;
            }

            Long routeStopId = "PICKUP".equals(tripType) ? assignment.getPickupStopId() : assignment.getDropStopId();
            TripStopEntity tripStop = tripStopsByRouteStopId.get(routeStopId);
            if (tripStop == null) {
                throw new IllegalArgumentException("Student transport assignment " + assignment.getId()
                        + " uses a stop that is not configured on this bus assignment.");
            }

            StudentsEntity student = studentsRepository.findById(assignment.getStudentId())
                    .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                    .filter(item -> item.getSchoolId().equals(schoolId))
                    .orElseThrow(() -> new IllegalArgumentException(
                            "An assigned student is not active or does not belong to this school."));

            TripStudentEntity tripStudent = new TripStudentEntity();
            tripStudent.setTripId(trip.getId());
            tripStudent.setStudentTransportAssignmentId(assignment.getId());
            tripStudent.setStudentId(student.getId());
            tripStudent.setStopId(tripStop.getId());
            tripStudent.setStopName(tripStop.getStopName());
            tripStudent.setStudentName((student.getFirstName() + " " +
                    (student.getLastName() == null ? "" : student.getLastName())).trim());
            tripStudent.setAdmissionNumber(student.getAdmissionNumber());
            tripStudent.setClassName(student.getClassName());
            tripStudent.setSection(student.getSection());
            tripStudent.setStatus("WAITING");
            result.add(tripStudent);
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsBySchoolAndDate(Long schoolId, LocalDate tripDate) {
        if (schoolId == null || !schoolRepository.existsById(schoolId)) {
            throw new IllegalArgumentException("Valid school is required.");
        }
        List<TripEntity> trips = tripDate == null
                ? tripRepository.findBySchoolIdOrderByTripDateDescScheduledStartTimeAsc(schoolId)
                : tripRepository.findBySchoolIdAndTripDateOrderByScheduledStartTimeAsc(schoolId, tripDate);
        return trips.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponse getTrip(Long tripId) {
        TripEntity trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found."));
        return toResponse(trip);
    }

    @Override
    public TripResponse updateTripStatus(Long tripId, UpdateTripStatusRequest request) {
        if (request == null || request.status() == null) {
            throw new IllegalArgumentException("Trip status is required.");
        }
        String next = request.status().trim().toUpperCase();
        if (!TRIP_STATUSES.contains(next)) throw new IllegalArgumentException("Invalid trip status.");

        TripEntity trip = getTripEntity(tripId);
        String current = trip.getStatus();
        boolean allowed = ("SCHEDULED".equals(current) && Set.of("IN_PROGRESS", "CANCELLED").contains(next))
                || ("IN_PROGRESS".equals(current) && Set.of("COMPLETED", "CANCELLED").contains(next));
        if (!allowed && !current.equals(next)) {
            throw new IllegalArgumentException("Trip cannot move from " + current + " to " + next + ".");
        }
        if ("IN_PROGRESS".equals(next) && "SCHEDULED".equals(current)) {
            validateTripReadyToStart(trip);
            if (trip.getActualStartAt() == null) {
                trip.setActualStartAt(LocalDateTime.now());
            }
        }
        if ("COMPLETED".equals(next)) {
            if (!"IN_PROGRESS".equals(current)) throw new IllegalArgumentException("Only an in-progress trip can be completed.");
            boolean unfinishedStops = tripStopRepository.findByTripIdOrderByStopOrderAsc(tripId).stream()
                    .anyMatch(stop -> Set.of("PENDING", "ARRIVED").contains(stop.getStatus()));
            if (unfinishedStops) throw new IllegalArgumentException("Complete or skip every trip stop before completing the trip.");
            boolean unfinishedStudents = tripStudentRepository.findByTripIdOrderByStopNameAscStudentNameAsc(tripId).stream()
                    .anyMatch(student -> "WAITING".equals(student.getStatus()));
            if (unfinishedStudents) throw new IllegalArgumentException("Update every student's boarding or drop status before completing the trip.");
            trip.setActualEndAt(LocalDateTime.now());
        }
        trip.setStatus(next);
        if (request.remarks() != null) trip.setRemarks(request.remarks().trim());
        tripRepository.save(trip);
        return toResponse(trip);
    }

    @Override
    public TripResponse updateStopStatus(Long tripId, Long stopId, UpdateTripChildStatusRequest request) {
        if (request == null || request.status() == null) throw new IllegalArgumentException("Stop status is required.");
        TripEntity trip = getTripEntity(tripId);
        if ("COMPLETED".equals(trip.getStatus()) || "CANCELLED".equals(trip.getStatus())) {
            throw new IllegalArgumentException("Stops cannot be updated after a trip is closed.");
        }
        TripStopEntity stop = tripStopRepository.findByIdAndTripId(stopId, tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip stop not found."));
        String next = request.status().trim().toUpperCase();
        boolean allowed = ("PENDING".equals(stop.getStatus()) && Set.of("ARRIVED", "SKIPPED").contains(next))
                || ("ARRIVED".equals(stop.getStatus()) && "DEPARTED".equals(next));
        if (!allowed && !stop.getStatus().equals(next)) throw new IllegalArgumentException("Invalid stop status transition.");

        if ("PENDING".equals(stop.getStatus()) && Set.of("ARRIVED", "SKIPPED").contains(next)) {
            ensurePreviousStopsClosed(trip, stop);
        }

        if (Set.of("ARRIVED", "SKIPPED").contains(next) && "SCHEDULED".equals(trip.getStatus())) {
            validateTripReadyToStart(trip);
            trip.setStatus("IN_PROGRESS");
            trip.setActualStartAt(LocalDateTime.now());
            tripRepository.save(trip);
        }
        if (Set.of("ARRIVED", "SKIPPED").contains(next) && !"IN_PROGRESS".equals(trip.getStatus())) {
            throw new IllegalArgumentException("Stops can only be operated while the trip is in progress.");
        }
        if ("ARRIVED".equals(next) && stop.getArrivedAt() == null) {
            stop.setArrivedAt(LocalDateTime.now());
        }
        if ("SKIPPED".equals(next)) {
            tripStudentRepository.findByTripIdOrderByStopNameAscStudentNameAsc(tripId).stream()
                    .filter(student -> student.getStopId().equals(stop.getId()))
                    .filter(student -> "WAITING".equals(student.getStatus()))
                    .forEach(student -> {
                        student.setStatus("ABSENT");
                        student.setRemarks("Stop skipped during trip operations.");
                    });
        }
        if ("DEPARTED".equals(next) && stop.getDepartedAt() == null) {
            boolean unfinishedStudents = tripStudentRepository
                    .findByTripIdOrderByStopNameAscStudentNameAsc(tripId).stream()
                    .filter(student -> student.getStopId().equals(stop.getId()))
                    .anyMatch(student -> !Set.of("PICKUP".equals(trip.getTripType()) ? "BOARDED" : "DROPPED", "ABSENT")
                            .contains(student.getStatus()));
            if (unfinishedStudents) {
                throw new IllegalArgumentException("Update every student at this stop before marking it departed.");
            }
            stop.setDepartedAt(LocalDateTime.now());
        }
        stop.setStatus(next);
        if (request.remarks() != null) stop.setRemarks(request.remarks().trim());
        tripStopRepository.save(stop);
        return toResponse(trip);
    }

    @Override
    public TripResponse updateStudentStatus(Long tripId, Long tripStudentId, UpdateTripChildStatusRequest request) {
        if (request == null || request.status() == null) throw new IllegalArgumentException("Student status is required.");
        TripEntity trip = getTripEntity(tripId);
        if ("COMPLETED".equals(trip.getStatus()) || "CANCELLED".equals(trip.getStatus())) {
            throw new IllegalArgumentException("Students cannot be updated after a trip is closed.");
        }
        TripStudentEntity student = tripStudentRepository.findByIdAndTripId(tripStudentId, tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip student not found."));
        String next = request.status().trim().toUpperCase();
        if (!"IN_PROGRESS".equals(trip.getStatus())) {
            throw new IllegalArgumentException("Student status can only be updated while the trip is in progress.");
        }
        TripStopEntity studentStop = tripStopRepository.findByIdAndTripId(student.getStopId(), tripId)
                .orElseThrow(() -> new IllegalArgumentException("The student's assigned trip stop was not found."));
        if (!"ARRIVED".equals(studentStop.getStatus())) {
            throw new IllegalArgumentException("Arrive at " + studentStop.getStopName() + " before updating this student's status.");
        }
        String completedStatus = "PICKUP".equals(trip.getTripType()) ? "BOARDED" : "DROPPED";
        if (student.getStatus().equals(next)) return toResponse(trip);
        if (!Set.of(completedStatus, "ABSENT").contains(next)) {
            throw new IllegalArgumentException("Student status must be " + completedStatus + " or ABSENT for this trip.");
        }
        if (!"WAITING".equals(student.getStatus())) {
            throw new IllegalArgumentException("A student's trip status has already been recorded and cannot be changed.");
        }
        if ("BOARDED".equals(next) && student.getBoardedAt() == null) student.setBoardedAt(LocalDateTime.now());
        if ("DROPPED".equals(next) && student.getDroppedAt() == null) student.setDroppedAt(LocalDateTime.now());
        student.setStatus(next);
        if (request.remarks() != null) student.setRemarks(request.remarks().trim());
        tripStudentRepository.save(student);
        return toResponse(trip);
    }

    /**
     * Stops must be handled in route order. A later stop cannot be arrived at
     * or skipped until all earlier stops have departed or been skipped.
     */
    private void ensurePreviousStopsClosed(TripEntity trip, TripStopEntity currentStop) {
        boolean previousStopOpen = tripStopRepository.findByTripIdOrderByStopOrderAsc(trip.getId()).stream()
                .filter(stop -> stop.getStopOrder() < currentStop.getStopOrder())
                .anyMatch(stop -> !Set.of("DEPARTED", "SKIPPED").contains(stop.getStatus()));
        if (previousStopOpen) {
            throw new IllegalArgumentException("Complete or skip the previous stop before proceeding to "
                    + currentStop.getStopName() + ".");
        }
    }

    /**
     * Server-side guard for every path that can start a trip.
     * Never rely on frontend readiness checks for operational safety.
     */
    private void validateTripReadyToStart(TripEntity trip) {
        BusAssignmentEntity assignment = busAssignmentRepository.findById(trip.getBusAssignmentId())
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .filter(item -> item.getSchoolId().equals(trip.getSchoolId()))
                .filter(item -> item.getBusId().equals(trip.getBusId()))
                .filter(item -> item.getRouteId().equals(trip.getRouteId()))
                .filter(item -> !item.getStartDate().isAfter(trip.getTripDate()))
                .filter(item -> item.getEndDate() == null || !item.getEndDate().isBefore(trip.getTripDate()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Trip cannot start: its bus assignment is missing, inactive, or outside its effective dates."));

        BusEntity bus = busRepository.findById(trip.getBusId())
                .filter(item -> item.getSchoolId().equals(trip.getSchoolId()))
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Trip cannot start: the assigned bus is missing or inactive."));

        RoutesEntity route = routeRepository.findById(trip.getRouteId())
                .filter(item -> item.getSchoolId().equals(trip.getSchoolId()))
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Trip cannot start: the assigned route is missing or inactive."));

        if (trip.getDriverAssignmentId() == null || trip.getDriverId() == null) {
            throw new IllegalArgumentException("Trip cannot start: assign an active driver to this bus first.");
        }

        DriverAssignmentEntity driverAssignment = driverAssignmentRepository.findById(trip.getDriverAssignmentId())
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .filter(item -> item.getSchoolId().equals(trip.getSchoolId()))
                .filter(item -> item.getBusId().equals(bus.getId()))
                .filter(item -> !item.getStartDate().isAfter(trip.getTripDate()))
                .filter(item -> item.getEndDate() == null || !item.getEndDate().isBefore(trip.getTripDate()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Trip cannot start: the driver assignment is missing, inactive, or not valid for this trip date."));

        boolean isOriginalDriver = driverAssignment.getDriverId().equals(trip.getDriverId());
        boolean isApprovedReplacement = !isOriginalDriver && driverAbsenceRepository
                .findFirstBySchoolIdAndDriverIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        trip.getSchoolId(), driverAssignment.getDriverId(), "ACTIVE", trip.getTripDate(), trip.getTripDate())
                .map(absence -> trip.getDriverId().equals(absence.getReplacementDriverId()))
                .orElse(false);
        if (!isOriginalDriver && !isApprovedReplacement) {
            throw new IllegalArgumentException("Trip cannot start: the selected driver is not the assigned driver or an approved replacement.");
        }

        DriversEntity driver = driversRepository.findById(trip.getDriverId())
                .filter(item -> item.getSchoolId().equals(trip.getSchoolId()))
                .filter(item -> "ACTIVE".equalsIgnoreCase(item.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Trip cannot start: the assigned or replacement driver is missing or inactive."));

        List<TripStopEntity> stops = tripStopRepository.findByTripIdOrderByStopOrderAsc(trip.getId());
        if (stops.isEmpty()) {
            throw new IllegalArgumentException("Trip cannot start: configure at least one stop for this trip.");
        }

        List<TripStudentEntity> students =
                tripStudentRepository.findByTripIdOrderByStopNameAscStudentNameAsc(trip.getId());
        if (students.isEmpty()) {
            throw new IllegalArgumentException("Trip cannot start: no students are assigned to this trip.");
        }

        Set<Long> tripStopIds = stops.stream().map(TripStopEntity::getId).collect(Collectors.toSet());
        boolean studentHasInvalidStop = students.stream().anyMatch(student -> !tripStopIds.contains(student.getStopId()));
        if (studentHasInvalidStop) {
            throw new IllegalArgumentException("Trip cannot start: every assigned student must be linked to a stop on this trip.");
        }

        if (bus.getCapacity() == null || students.size() > bus.getCapacity()) {
            throw new IllegalArgumentException("Trip cannot start: assigned students exceed the bus capacity.");
        }
    }

    private TripEntity getTripEntity(Long id) {
        return tripRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Trip not found."));
    }

    private TripResponse toResponse(TripEntity trip) {
        List<TripStopResponse> stops = tripStopRepository.findByTripIdOrderByStopOrderAsc(trip.getId())
                .stream().map(TripStopResponse::from).toList();
        List<TripStudentResponse> students = tripStudentRepository.findByTripIdOrderByStopNameAscStudentNameAsc(trip.getId())
                .stream().map(TripStudentResponse::from).toList();
        return TripResponse.from(trip, stops, students);
    }
}
