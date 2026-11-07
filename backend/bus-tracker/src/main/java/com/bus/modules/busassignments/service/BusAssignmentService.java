package com.bus.modules.busassignments.service;

import java.util.List;

import com.bus.modules.busassignments.entity.BusAssignmentEntity;

public interface BusAssignmentService {

    BusAssignmentEntity createAssignment(BusAssignmentEntity assignment);

    BusAssignmentEntity updateAssignment(Long id, BusAssignmentEntity assignment);

    BusAssignmentEntity getAssignmentById(Long id);

    List<BusAssignmentEntity> getAllAssignments();

    List<BusAssignmentEntity> getAssignmentsByBusId(Long busId);

    List<BusAssignmentEntity> getAssignmentsByRouteId(Long routeId);

    void deleteAssignment(Long id);
}
