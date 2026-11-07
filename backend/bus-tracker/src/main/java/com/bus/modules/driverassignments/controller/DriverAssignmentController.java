package com.bus.modules.driverassignments.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.driverassignments.entity.DriverAssignmentEntity;
import com.bus.modules.driverassignments.service.DriverAssignmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/driver-assignment")
@RequiredArgsConstructor
public class DriverAssignmentController {

    private final DriverAssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<DriverAssignmentEntity> createAssignment(@RequestBody DriverAssignmentEntity assignment) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.createAssignment(assignment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DriverAssignmentEntity> updateAssignment(
            @PathVariable Long id, @RequestBody DriverAssignmentEntity assignment) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, assignment));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DriverAssignmentEntity> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(id));
    }

    @GetMapping
    public ResponseEntity<List<DriverAssignmentEntity>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/bus/{busId}")
    public ResponseEntity<List<DriverAssignmentEntity>> getAssignmentsByBus(@PathVariable Long busId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByBusId(busId));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<DriverAssignmentEntity>> getAssignmentsByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByDriverId(driverId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}
