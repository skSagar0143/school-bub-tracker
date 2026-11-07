package com.bus.modules.busassignments.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.busassignments.entity.BusAssignmentEntity;
import com.bus.modules.busassignments.service.BusAssignmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/bus-assignment")
@RequiredArgsConstructor
public class BusAssignmentController {

    private final BusAssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<BusAssignmentEntity> createAssignment(@RequestBody BusAssignmentEntity assignment) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.createAssignment(assignment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusAssignmentEntity> updateAssignment(
            @PathVariable Long id, @RequestBody BusAssignmentEntity assignment) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, assignment));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusAssignmentEntity> getAssignmentById(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(id));
    }

    @GetMapping
    public ResponseEntity<List<BusAssignmentEntity>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/bus/{busId}")
    public ResponseEntity<List<BusAssignmentEntity>> getAssignmentsByBus(@PathVariable Long busId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByBusId(busId));
    }

    @GetMapping("/route/{routeId}")
    public ResponseEntity<List<BusAssignmentEntity>> getAssignmentsByRoute(@PathVariable Long routeId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByRouteId(routeId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}
