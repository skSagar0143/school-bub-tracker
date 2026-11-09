package com.bus.modules.studenttransportassignments.service;

import java.util.List;

import com.bus.modules.studenttransportassignments.entity.StudentTransportAssignmentEntity;

public interface StudentTransportAssignmentService {

    StudentTransportAssignmentEntity createAssignment(StudentTransportAssignmentEntity assignment);

    StudentTransportAssignmentEntity updateAssignment(Long id, StudentTransportAssignmentEntity assignment);

    StudentTransportAssignmentEntity getAssignmentById(Long id);

    List<StudentTransportAssignmentEntity> getAllAssignments();

    List<StudentTransportAssignmentEntity> getAssignmentsByStudentId(Long studentId);

    List<StudentTransportAssignmentEntity> getAssignmentsByRouteId(Long routeId);

    void deleteAssignment(Long id);
}