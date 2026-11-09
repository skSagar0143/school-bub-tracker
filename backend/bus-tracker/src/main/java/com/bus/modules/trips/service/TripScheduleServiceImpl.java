package com.bus.modules.trips.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.bus.modules.trips.dto.TripScheduleRequest;
import com.bus.modules.trips.dto.TripScheduleResponse;
import com.bus.modules.trips.entity.TripScheduleEntity;
import com.bus.modules.trips.repository.TripScheduleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TripScheduleServiceImpl implements TripScheduleService {

	private final TripScheduleRepository repository;

	@Override
	public TripScheduleResponse createSchedule(TripScheduleRequest request) {

		validateRequest(request);

		TripScheduleEntity entity = new TripScheduleEntity();

		mapRequestToEntity(request, entity);

		TripScheduleEntity saved = repository.save(entity);

		return mapEntityToResponse(saved);
	}

	@Override
	public TripScheduleResponse updateSchedule(Long id, TripScheduleRequest request) {

		validateRequest(request);

		TripScheduleEntity entity = repository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip schedule not found"));

		mapRequestToEntity(request, entity);

		TripScheduleEntity updated = repository.save(entity);

		return mapEntityToResponse(updated);
	}

	@Override
	@Transactional(readOnly = true)
	public TripScheduleResponse getScheduleById(Long id) {

		TripScheduleEntity entity = repository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip schedule not found"));

		return mapEntityToResponse(entity);
	}

	@Override
	@Transactional(readOnly = true)
	public List<TripScheduleResponse> getSchedulesBySchool(Long schoolId) {

		return repository.findBySchoolIdAndStatusOrderByStartTimeAsc(schoolId, "ACTIVE").stream()
				.map(this::mapEntityToResponse).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<TripScheduleResponse> getSchedulesByBusAssignment(Long busAssignmentId) {

		return repository.findByBusAssignmentIdAndTripTypeAndStatus(busAssignmentId, "PICKUP", "ACTIVE").stream()
				.map(this::mapEntityToResponse).toList();
	}

	@Override
	public void deleteSchedule(Long id) {

		TripScheduleEntity entity = repository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip schedule not found"));

		// Soft delete: preserve schedule history.
		entity.setStatus("INACTIVE");

		repository.save(entity);
	}

	private void validateRequest(TripScheduleRequest request) {

		if (request.getSchoolId() == null || request.getBusAssignmentId() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "School ID and bus assignment ID are required");
		}

		if (request.getTripType() == null
				|| !(request.getTripType().equals("PICKUP") || request.getTripType().equals("DROP"))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip type must be PICKUP or DROP");
		}

		if (request.getStartTime() == null || request.getEffectiveFrom() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Start time and effective from date are required");
		}

		if (request.getEffectiveUntil() != null && request.getEffectiveUntil().isBefore(request.getEffectiveFrom())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Effective until cannot be before effective from");
		}

		if (request.getOperatingDays() == null || request.getOperatingDays().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Operating days are required");
		}
	}

	private void mapRequestToEntity(TripScheduleRequest request, TripScheduleEntity entity) {

		entity.setSchoolId(request.getSchoolId());
		entity.setBusAssignmentId(request.getBusAssignmentId());
		entity.setTripType(request.getTripType().toUpperCase());
		entity.setStartTime(request.getStartTime());
		entity.setEffectiveFrom(request.getEffectiveFrom());
		entity.setEffectiveUntil(request.getEffectiveUntil());
		entity.setOperatingDays(request.getOperatingDays().toUpperCase());
		entity.setRemarks(request.getRemarks());

		if (request.getStatus() != null && !request.getStatus().isBlank()) {
			entity.setStatus(request.getStatus().toUpperCase());
		} else if (entity.getStatus() == null) {
			entity.setStatus("ACTIVE");
		}
	}

	private TripScheduleResponse mapEntityToResponse(TripScheduleEntity entity) {

		TripScheduleResponse response = new TripScheduleResponse();

		response.setId(entity.getId());
		response.setSchoolId(entity.getSchoolId());
		response.setBusAssignmentId(entity.getBusAssignmentId());
		response.setTripType(entity.getTripType());
		response.setStartTime(entity.getStartTime());
		response.setEffectiveFrom(entity.getEffectiveFrom());
		response.setEffectiveUntil(entity.getEffectiveUntil());
		response.setOperatingDays(entity.getOperatingDays());
		response.setStatus(entity.getStatus());
		response.setRemarks(entity.getRemarks());
		response.setCreatedAt(entity.getCreatedAt());
		response.setUpdatedAt(entity.getUpdatedAt());

		return response;
	}
}