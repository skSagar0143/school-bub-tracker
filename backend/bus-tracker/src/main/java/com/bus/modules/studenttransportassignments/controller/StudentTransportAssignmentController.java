package com.bus.modules.studenttransportassignments.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.studenttransportassignments.entity.StudentTransportAssignmentEntity;
import com.bus.modules.studenttransportassignments.service.StudentTransportAssignmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/student-transport-assignment")
@RequiredArgsConstructor
public class StudentTransportAssignmentController {

    private final StudentTransportAssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<StudentTransportAssignmentEntity> createAssignment(
            @RequestBody StudentTransportAssignmentEntity assignment) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.createAssignment(assignment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentTransportAssignmentEntity> updateAssignment(
            @PathVariable Long id,
            @RequestBody StudentTransportAssignmentEntity assignment) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, assignment));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentTransportAssignmentEntity> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(id));
    }

    @GetMapping
    public ResponseEntity<List<StudentTransportAssignmentEntity>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentTransportAssignmentEntity>> getAssignmentsByStudent(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByStudentId(studentId));
    }

    @GetMapping("/route/{routeId}")
    public ResponseEntity<List<StudentTransportAssignmentEntity>> getAssignmentsByRoute(
            @PathVariable Long routeId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByRouteId(routeId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}