package com.bus.modules.busassignmentstops.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.busassignments.entity.BusAssignmentEntity;
import com.bus.modules.busassignments.repository.BusAssignmentRepository;
import com.bus.modules.busassignmentstops.entity.BusAssignmentStopEntity;
import com.bus.modules.busassignmentstops.repository.BusAssignmentStopRepository;
import com.bus.modules.routestops.entity.RouteStopsEntity;
import com.bus.modules.routestops.repository.RouteStopsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BusAssignmentStopServiceImpl implements BusAssignmentStopService {

    private final BusAssignmentStopRepository assignmentStopRepository;
    private final BusAssignmentRepository busAssignmentRepository;
    private final RouteStopsRepository routeStopsRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RouteStopsEntity> getStopsByBusAssignment(Long busAssignmentId) {
        BusAssignmentEntity assignment = getActiveAssignment(busAssignmentId);

        return assignmentStopRepository.findByBusAssignmentId(busAssignmentId).stream()
                .map(mapping -> routeStopsRepository.findById(mapping.getRouteStopId())
                        .filter(stop -> "ACTIVE".equals(stop.getStatus()))
                        .orElse(null))
                .filter(stop -> stop != null && assignment.getRouteId().equals(stop.getRouteId()))
                .sorted(Comparator.comparing(RouteStopsEntity::getStopOrder))
                .toList();
    }

    @Override
    public List<RouteStopsEntity> replaceStops(Long busAssignmentId, List<Long> routeStopIds) {
        BusAssignmentEntity assignment = getActiveAssignment(busAssignmentId);
        List<Long> ids = routeStopIds == null ? List.of() : routeStopIds;

        if (new HashSet<>(ids).size() != ids.size()) {
            throw new IllegalArgumentException("Duplicate route stop IDs are not allowed");
        }

        List<RouteStopsEntity> validatedStops = validateStops(assignment, ids);

        assignmentStopRepository.deleteByBusAssignmentId(busAssignmentId);
        List<BusAssignmentStopEntity> mappings = validatedStops.stream().map(stop -> {
            BusAssignmentStopEntity mapping = new BusAssignmentStopEntity();
            mapping.setBusAssignmentId(busAssignmentId);
            mapping.setRouteStopId(stop.getId());
            return mapping;
        }).toList();

        assignmentStopRepository.saveAll(mappings);
        return validatedStops;
    }

    @Override
    public RouteStopsEntity addStop(Long busAssignmentId, Long routeStopId) {
        BusAssignmentEntity assignment = getActiveAssignment(busAssignmentId);
        RouteStopsEntity stop = validateStop(assignment, routeStopId);

        if (assignmentStopRepository.existsByBusAssignmentIdAndRouteStopId(busAssignmentId, routeStopId)) {
            throw new IllegalArgumentException("This stop is already mapped to the bus assignment");
        }

        BusAssignmentStopEntity mapping = new BusAssignmentStopEntity();
        mapping.setBusAssignmentId(busAssignmentId);
        mapping.setRouteStopId(routeStopId);
        assignmentStopRepository.save(mapping);
        return stop;
    }

    @Override
    public void removeStop(Long busAssignmentId, Long routeStopId) {
        getActiveAssignment(busAssignmentId);
        if (!assignmentStopRepository.existsByBusAssignmentIdAndRouteStopId(busAssignmentId, routeStopId)) {
            throw new IllegalArgumentException("Bus assignment stop mapping not found");
        }
        assignmentStopRepository.deleteByBusAssignmentIdAndRouteStopId(busAssignmentId, routeStopId);
    }

    private BusAssignmentEntity getActiveAssignment(Long busAssignmentId) {
        return busAssignmentRepository.findById(busAssignmentId)
                .filter(assignment -> "ACTIVE".equals(assignment.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("Active bus assignment not found"));
    }

    private List<RouteStopsEntity> validateStops(BusAssignmentEntity assignment, List<Long> stopIds) {
        List<RouteStopsEntity> stops = new ArrayList<>();
        for (Long stopId : stopIds) {
            stops.add(validateStop(assignment, stopId));
        }
        stops.sort(Comparator.comparing(RouteStopsEntity::getStopOrder));
        return stops;
    }

    private RouteStopsEntity validateStop(BusAssignmentEntity assignment, Long routeStopId) {
        if (routeStopId == null) {
            throw new IllegalArgumentException("Route stop ID is required");
        }

        RouteStopsEntity stop = routeStopsRepository.findById(routeStopId)
                .filter(item -> "ACTIVE".equals(item.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("Active route stop not found"));

        if (!assignment.getRouteId().equals(stop.getRouteId())) {
            throw new IllegalArgumentException("Selected stop does not belong to the route assigned to this bus");
        }
        return stop;
    }
}
