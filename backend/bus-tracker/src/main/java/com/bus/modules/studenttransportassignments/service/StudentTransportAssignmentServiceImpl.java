package com.bus.modules.studenttransportassignments.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.routes.entity.RoutesEntity;
import com.bus.modules.routes.repository.RouteRepository;
import com.bus.modules.routestops.entity.RouteStopsEntity;
import com.bus.modules.routestops.repository.RouteStopsRepository;
import com.bus.modules.studenttransportassignments.entity.StudentTransportAssignmentEntity;
import com.bus.modules.studenttransportassignments.repository.StudentTransportAssignmentRepository;
import com.bus.modules.students.entity.StudentsEntity;
import com.bus.modules.students.repository.StudentsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class StudentTransportAssignmentServiceImpl implements StudentTransportAssignmentService {

    private final StudentTransportAssignmentRepository assignmentRepository;
    private final StudentsRepository studentsRepository;
    private final RouteRepository routeRepository;
    private final RouteStopsRepository routeStopsRepository;

    @Override
    public StudentTransportAssignmentEntity createAssignment(StudentTransportAssignmentEntity assignment) {
        validateAssignment(assignment, null);
        assignment.setStatus("ACTIVE");
        return assignmentRepository.save(assignment);
    }

    @Override
    public StudentTransportAssignmentEntity updateAssignment(Long id, StudentTransportAssignmentEntity request) {
        StudentTransportAssignmentEntity existing = getAssignmentById(id);
        validateAssignment(request, id);

        existing.setSchoolId(request.getSchoolId());
        existing.setStudentId(request.getStudentId());
        existing.setRouteId(request.getRouteId());
        existing.setPickupStopId(request.getPickupStopId());
        existing.setDropStopId(request.getDropStopId());
        existing.setStartDate(request.getStartDate());
        existing.setEndDate(request.getEndDate());
        existing.setRemarks(request.getRemarks());

        return assignmentRepository.save(existing);
    }

    private void validateAssignment(StudentTransportAssignmentEntity assignment, Long excludeId) {
        if (assignment.getSchoolId() == null || assignment.getStudentId() == null
                || assignment.getRouteId() == null || assignment.getStartDate() == null) {
            throw new IllegalArgumentException("School, student, route and start date are required");
        }

        boolean requiresPickup = Boolean.TRUE.equals(assignment.getRequiresPickup());
        boolean requiresDrop = Boolean.TRUE.equals(assignment.getRequiresDrop());
        if (!requiresPickup && !requiresDrop) {
            throw new IllegalArgumentException("At least one transport service (pickup or drop) must be selected");
        }
        if (requiresPickup && assignment.getPickupStopId() == null) {
            throw new IllegalArgumentException("Home pickup stop is required when pickup service is selected");
        }
        if (!requiresPickup) assignment.setPickupStopId(null);
        if (requiresDrop && assignment.getDropStopId() == null) {
            throw new IllegalArgumentException("Home drop stop is required when drop service is selected");
        }
        if (!requiresDrop) assignment.setDropStopId(null);

        if (assignment.getEndDate() != null
                && assignment.getEndDate().isBefore(assignment.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        StudentsEntity student = studentsRepository.findById(assignment.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        RoutesEntity route = routeRepository.findById(assignment.getRouteId())
                .orElseThrow(() -> new IllegalArgumentException("Route not found"));

        if (!"ACTIVE".equals(student.getStatus())) {
            throw new IllegalArgumentException("Only active students can be assigned transport");
        }
        if (!"ACTIVE".equals(route.getStatus())) {
            throw new IllegalArgumentException("Only active routes can be assigned");
        }
        if (!student.getSchoolId().equals(assignment.getSchoolId())
                || !route.getSchoolId().equals(assignment.getSchoolId())) {
            throw new IllegalArgumentException("Student, route and assignment must belong to the same school");
        }

        RouteStopsEntity homeStop = null;
        RouteStopsEntity schoolStop = null;
        if (requiresPickup) {
            homeStop = routeStopsRepository.findById(assignment.getPickupStopId())
                    .orElseThrow(() -> new IllegalArgumentException("Home pickup stop not found"));
            if (!homeStop.getRouteId().equals(route.getId()) || !"ACTIVE".equals(homeStop.getStatus())) {
                throw new IllegalArgumentException("Home pickup stop must be active and belong to the selected route");
            }
            if (!Boolean.TRUE.equals(homeStop.getPickupAllowed())) {
                throw new IllegalArgumentException("Home stop does not allow pickup");
            }
        }
        if (requiresDrop) {
            schoolStop = routeStopsRepository.findById(assignment.getDropStopId())
                    .orElseThrow(() -> new IllegalArgumentException("Home drop stop not found"));
            if (!schoolStop.getRouteId().equals(route.getId()) || !"ACTIVE".equals(schoolStop.getStatus())) {
                throw new IllegalArgumentException("Home drop stop must be active and belong to the selected route");
            }
            if (!Boolean.TRUE.equals(schoolStop.getDropAllowed())) {
                throw new IllegalArgumentException("Home stop does not allow drop-off");
            }
        }
        if (homeStop != null && schoolStop != null && homeStop.getId().equals(schoolStop.getId())) {
            throw new IllegalArgumentException("Pickup and drop stops must be different");
        }

        if (assignmentRepository.existsOverlappingActiveAssignment(
                assignment.getStudentId(), assignment.getStartDate(), assignment.getEndDate(), excludeId)) {
            throw new IllegalArgumentException("Student already has an overlapping active transport assignment");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public StudentTransportAssignmentEntity getAssignmentById(Long id) {
        return assignmentRepository.findById(id)
                .filter(item -> "ACTIVE".equals(item.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("Student transport assignment not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentTransportAssignmentEntity> getAllAssignments() {
        return assignmentRepository.findByStatusOrderByStartDateDesc("ACTIVE");
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentTransportAssignmentEntity> getAssignmentsByStudentId(Long studentId) {
        return assignmentRepository.findByStudentIdOrderByStartDateDesc(studentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentTransportAssignmentEntity> getAssignmentsByRouteId(Long routeId) {
        return assignmentRepository.findByRouteIdOrderByStartDateDesc(routeId);
    }

    @Override
    public void deleteAssignment(Long id) {
        StudentTransportAssignmentEntity assignment = getAssignmentById(id);
        assignment.setStatus("INACTIVE");
        assignmentRepository.save(assignment);
    }
}