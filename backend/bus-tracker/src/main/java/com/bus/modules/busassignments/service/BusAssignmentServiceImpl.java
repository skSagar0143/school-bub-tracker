package com.bus.modules.busassignments.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.busassignments.entity.BusAssignmentEntity;
import com.bus.modules.busassignments.repository.BusAssignmentRepository;
import com.bus.modules.busses.entity.BusEntity;
import com.bus.modules.busses.repository.BusRepository;
import com.bus.modules.routes.entity.RoutesEntity;
import com.bus.modules.routes.repository.RouteRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BusAssignmentServiceImpl implements BusAssignmentService {

    private final BusAssignmentRepository assignmentRepository;
    private final BusRepository busRepository;
    private final RouteRepository routeRepository;

    @Override
    public BusAssignmentEntity createAssignment(BusAssignmentEntity assignment) {
        validateAssignment(assignment, null);
        assignment.setStatus("ACTIVE");
        return assignmentRepository.save(assignment);
    }

    @Override
    public BusAssignmentEntity updateAssignment(Long id, BusAssignmentEntity request) {
        BusAssignmentEntity existing = getAssignmentById(id);
        validateAssignment(request, id);

        existing.setSchoolId(request.getSchoolId());
        existing.setBusId(request.getBusId());
        existing.setRouteId(request.getRouteId());
        existing.setStartDate(request.getStartDate());
        existing.setEndDate(request.getEndDate());
        existing.setRemarks(request.getRemarks());

        return assignmentRepository.save(existing);
    }

    private void validateAssignment(BusAssignmentEntity assignment, Long excludeId) {
        if (assignment.getSchoolId() == null || assignment.getBusId() == null
                || assignment.getRouteId() == null || assignment.getStartDate() == null) {
            throw new IllegalArgumentException("School, bus, route and start date are required");
        }
        if (assignment.getEndDate() != null && assignment.getEndDate().isBefore(assignment.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        BusEntity bus = busRepository.findById(assignment.getBusId())
                .orElseThrow(() -> new IllegalArgumentException("Bus not found"));
        RoutesEntity route = routeRepository.findById(assignment.getRouteId())
                .orElseThrow(() -> new IllegalArgumentException("Route not found"));

        if (!"ACTIVE".equals(bus.getStatus())) {
            throw new IllegalArgumentException("Only active buses can be assigned");
        }
        if (!"ACTIVE".equals(route.getStatus())) {
            throw new IllegalArgumentException("Only active routes can be assigned");
        }
        if (!bus.getSchoolId().equals(assignment.getSchoolId())
                || !route.getSchoolId().equals(assignment.getSchoolId())) {
            throw new IllegalArgumentException("Bus, route and assignment must belong to the same school");
        }

        if (assignmentRepository.existsOverlappingActiveAssignmentForBus(
                assignment.getBusId(), assignment.getStartDate(), assignment.getEndDate(), excludeId)) {
            throw new IllegalArgumentException("This bus already has an overlapping active route assignment");
        }
        // Multiple buses may serve the same route during overlapping dates.
        // Only overlapping assignments for the same bus are prohibited.
    }

    @Override
    @Transactional(readOnly = true)
    public BusAssignmentEntity getAssignmentById(Long id) {
        return assignmentRepository.findById(id)
                .filter(item -> "ACTIVE".equals(item.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("Bus assignment not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusAssignmentEntity> getAllAssignments() {
        return assignmentRepository.findByStatusOrderByStartDateDesc("ACTIVE");
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusAssignmentEntity> getAssignmentsByBusId(Long busId) {
        return assignmentRepository.findByBusIdOrderByStartDateDesc(busId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusAssignmentEntity> getAssignmentsByRouteId(Long routeId) {
        return assignmentRepository.findByRouteIdOrderByStartDateDesc(routeId);
    }

    @Override
    public void deleteAssignment(Long id) {
        BusAssignmentEntity assignment = getAssignmentById(id);
        assignment.setStatus("INACTIVE");
        assignmentRepository.save(assignment);
    }
}
