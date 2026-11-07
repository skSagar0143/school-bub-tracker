package com.bus.modules.driverassignments.service;

import java.util.List;

import com.bus.modules.driverassignments.entity.DriverAssignmentEntity;

public interface DriverAssignmentService {

    DriverAssignmentEntity createAssignment(DriverAssignmentEntity assignment);

    DriverAssignmentEntity updateAssignment(Long id, DriverAssignmentEntity assignment);

    DriverAssignmentEntity getAssignmentById(Long id);

    List<DriverAssignmentEntity> getAllAssignments();

    List<DriverAssignmentEntity> getAssignmentsByBusId(Long busId);

    List<DriverAssignmentEntity> getAssignmentsByDriverId(Long driverId);

    void deleteAssignment(Long id);
}
